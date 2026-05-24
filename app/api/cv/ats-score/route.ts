import { auth } from "@/auth";
import { prisma, resolveUserId } from "@/lib/server/prisma";
import { NextResponse } from "next/server";
import { calculateATSScore } from "@/lib/aiService";
import { withCache } from "@/lib/server/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("versionId");

  try {
    let version;
    if (versionId) {
      // First find the version by ID
      version = await prisma.resumeVersion.findUnique({
        where: { id: versionId },
        include: { resume: { select: { userId: true } } }
      });
      // Then verify ownership
      if (version && (version as any).resume?.userId !== userId) {
        return NextResponse.json({ error: "No resume version found" }, { status: 404 });
      }
    } else {
      version = await prisma.resumeVersion.findFirst({
        where: { resume: { userId: userId }, isMain: true }
      });
    }

    if (!version) {
      return NextResponse.json({ error: "No resume version found" }, { status: 404 });
    }

    const ensureObject = (val: any): any => {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return {};
    };

    const ensureArray = (val: any): any[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const personalInfo = ensureObject(version.personalInfo);
    const skills = ensureObject(version.skills);
    const experience = ensureArray(version.experience);
    const education = ensureArray(version.education);
    const projects = ensureArray(version.projects);
    const achievements = ensureArray(version.achievements);

    const cvText = `
Name: ${personalInfo.name || "Anonymous"}
Target Role: ${personalInfo.targetRole || "Software Engineer"}
Summary: ${version.summary || "No summary provided."}

Skills:
Languages: ${(skills.languages || []).join(", ")}
Frameworks: ${(skills.frameworks || []).join(", ")}
Tools: ${(skills.tools || []).join(", ")}

Experience:
${experience.map((e: any) => `${e.company || 'Company'} (${e.title || 'Role'}): ${e.period || 'Period'}\n- ${(e.bullets || []).join("\n- ")}`).join("\n\n")}

Education:
${education.map((e: any) => `${e.school || 'School'} (${e.degree || 'Degree'}): ${e.year || 'Year'}`).join("\n\n")}

Projects:
${projects.map((p: any) => `${p.title || p.name || 'Untitled'} (${Array.isArray(p.techStack) ? p.techStack.join(', ') : (p.techStack || 'Unspecified')})\n- ${(p.highlights || p.bullets || []).join("\n- ")}`).join("\n\n")}

Achievements:
${achievements.filter((a: any) => typeof a === "string" && a.trim()).map((ach: string) => `- ${ach}`).join("\n")}
    `;

    const payload = { 
      content: cvText.trim(), 
      target: personalInfo.targetRole || "Software Engineer" 
    };

    const parsed = await withCache(
      "ats-score",
      payload,
      () => calculateATSScore(cvText, personalInfo.targetRole || "Software Engineer")
    );

    // Persist score to DB
    await prisma.resumeVersion.update({
      where: { id: version.id },
      data: { atsScore: parsed.score }
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("[ATS] ERROR:", error);
    return NextResponse.json({ 
      score: 0,
      breakdown: { skills: 0, projects: 0, impact: 0, overall: 0 },
      weakSignals: ["SERVICE_BUSY"],
      topIssues: ["System is under heavy load"],
      quickFixes: ["Wait 30 seconds and refresh"],
      error: error.message || "Analysis failed"
    });
  }
}
