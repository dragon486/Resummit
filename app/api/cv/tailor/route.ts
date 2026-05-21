import { auth } from "@/auth";
import { prisma, resolveUserId } from "@/lib/server/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  const session = await auth();
  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { resumeId, jobDescription, jobTitle } = await req.json();

    if (!resumeId || !jobDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch the main version of the resume
    const mainVersion = await prisma.resumeVersion.findFirst({
      where: { 
        resume: { id: resumeId, userId: userId },
        isMain: true 
      }
    });

    if (!mainVersion) {
      return NextResponse.json({ error: "Main resume version not found" }, { status: 404 });
    }

    // 2. Use AI to tailor the content
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      You are an elite career coach and ATS optimization expert.
      Your goal is to tailor a user's resume for a specific job description.
      
      JOB TITLE: ${jobTitle}
      JOB DESCRIPTION:
      ${jobDescription}
      
      USER'S CURRENT RESUME DATA:
      ${JSON.stringify(mainVersion)}
      
      TASK:
      1. Analyze the Job Description for keywords, required skills, and core responsibilities.
      2. Tailor the Executive Summary to highlight alignment with this specific role.
      3. Reorder or refine skills to match the job requirements.
      4. Suggest minor tweaks to project bullets (if needed) to better match the JD's technical language.
      
      OUTPUT:
      Return ONLY a JSON object that matches the structure of the resume data.
      Structure:
      {
        "personalInfo": { ... },
        "summary": "Tailored summary...",
        "skills": { "languages": [...], "frameworks": [...], "tools": [...] },
        "experience": [ ... ],
        "projects": [ ... ],
        "education": [ ... ],
        "achievements": [ ... ],
        "atsScore": (estimated score for this JD out of 100)
      }
      
      Keep the personalInfo, experience, education, and achievements mostly the same, but focus on the summary and skills optimization.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handle potential markdown blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const tailoredData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!tailoredData) {
      throw new Error("AI failed to generate tailored data");
    }

    // 3. Create a new ResumeVersion for this job
    const newVersion = await prisma.resumeVersion.create({
      data: {
        resumeId: resumeId,
        versionName: `Tailored: ${jobTitle || "Job Application"}`,
        isMain: false,
        personalInfo: tailoredData.personalInfo,
        summary: tailoredData.summary,
        skills: tailoredData.skills,
        experience: tailoredData.experience,
        projects: tailoredData.projects,
        education: tailoredData.education,
        achievements: tailoredData.achievements || (mainVersion.achievements as any) || [],
        atsScore: tailoredData.atsScore || 0,
      }
    });

    // 4. Create JobTarget record
    await prisma.jobTarget.create({
      data: {
        resumeId: resumeId,
        jobTitle: jobTitle || "Untitled Role",
        jobDescription: jobDescription,
        optimizedResumeId: newVersion.id,
      }
    });

    return NextResponse.json({ 
      success: true, 
      versionId: newVersion.id,
      data: newVersion 
    });

  } catch (error: any) {
    console.error("Tailor Error:", error);
    return NextResponse.json({ error: "Failed to tailor resume" }, { status: 500 });
  }
}
