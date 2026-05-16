import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { validateCVText } from "@/lib/github";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectSchema = z.object({
  id: z.string(),
  title: z.string().default("Untitled Project"),
  description: z.string().nullish().default(""),
  techStack: z.array(z.string()).nullish().default([]),
  liveUrl: z.string().nullish(),
  githubUrl: z.string().nullish(),
  highlights: z.array(z.string()).nullish().default([]),
  aiGenerated: z.boolean().optional().default(false),
  included: z.boolean().optional().default(true),
});

const cvSchema = z.object({
  versionId: z.string(),
  data: z.object({
    personalInfo: z.any(),
    summary: z.string().default(""),
    skills: z.any(),
    experience: z.array(z.any()).default([]),
    projects: z.array(projectSchema).default([]),
    education: z.array(z.any()).default([]),
    atsScore: z.number().optional().default(0),
  }),
});


export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { versionId, data } = cvSchema.parse(body);

    // Update ResumeVersion
    await prisma.resumeVersion.update({
      where: { id: versionId },
      data: {
        personalInfo: data.personalInfo,
        summary: data.summary,
        skills: data.skills,
        experience: data.experience,
        projects: data.projects as any, // Cast to any because Prisma Json type is picky
        education: data.education,
        atsScore: data.atsScore || 0,
      }
    });

    // Run CV quality validation
    const allText = [
      data.summary,
      ...data.experience.flatMap((e: any) => [e.title, e.company, ...(e.bullets || [])]),
      ...data.projects.flatMap((p: any) => [p.title, ...(p.highlights || [])]),
    ].join(" ");
    const warnings = validateCVText(allText);

    // Auto-fix duplicate words in experience titles (e.g. "Software Software" → "Software")
    const fixedExperience = data.experience.map((exp: any) => ({
      ...exp,
      title: (exp.title || "").replace(/\b(\w+)\s+\1\b/gi, "$1").trim(),
    }));

    return NextResponse.json({ success: true, warnings });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("AutoSave Validation Error:", JSON.stringify(error.errors, null, 2));
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("AutoSave Server Error:", error);
    return NextResponse.json({ error: "Failed to auto-save" }, { status: 500 });
  }
}

