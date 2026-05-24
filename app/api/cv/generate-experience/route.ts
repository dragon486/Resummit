import { auth } from "@/auth";
import { prisma, resolveUserId } from "@/lib/server/prisma";
import { callAI, safeParseJSON } from "@/lib/aiService";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { company, title, period, context } = await req.json();

    if (!company || !title) {
      return NextResponse.json({ error: "Company and title are required" }, { status: 400 });
    }

    const prompt = `Generate 3 professional resume bullets for a ${title} at ${company} (${period || "recent"}).

${context ? `Additional context provided by the user: "${context}"` : ""}

RULES:
- Start each bullet with a strong past/present action verb (Developed, Built, Implemented, Designed, Led, Automated, etc.)
- Each bullet must be under 20 words
- Include the specific technology or method used where possible
- At least one bullet must reference a measurable or logical outcome
- No buzzwords: leveraged, robust, scalable, streamlined, spearheaded, cutting-edge
- Do NOT start any bullet with "I"
- Return ONLY valid JSON, nothing else

{
  "bullets": [
    "Bullet one here.",
    "Bullet two here.",
    "Bullet three here."
  ]
}`;

    let bullets: string[] = [];
    try {
      const raw = await callAI(prompt);
      const parsed = safeParseJSON(raw);
      bullets = (parsed.bullets || [])
        .filter((b: string) => typeof b === "string" && b.trim().length > 0)
        .slice(0, 3);
    } catch (e) {
      console.warn("[EXPERIENCE BULLETS] AI failed, falling back to deterministic bullets:", e);
      bullets = [
        `Designed and implemented high-performance modular components for ${title} workflows at ${company}.`,
        `Integrated core software APIs and libraries to increase runtime stability and application delivery.`,
        `Automated standard quality checks and deployment pipelines to decrease cycle times for the engineering team.`
      ];
    }

    if (bullets.length === 0) {
      bullets = [
        `Designed and implemented high-performance modular components for ${title} workflows at ${company}.`,
        `Integrated core software APIs and libraries to increase runtime stability and application delivery.`,
        `Automated standard quality checks and deployment pipelines to decrease cycle times for the engineering team.`
      ];
    }

    return NextResponse.json({ bullets });
  } catch (error: any) {
    console.error("[EXPERIENCE BULLETS] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
