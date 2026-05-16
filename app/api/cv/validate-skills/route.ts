import { auth } from "@/auth";
import { prisma, resolveUserId } from "@/lib/server/prisma";
import { extractDeterministicSkills } from "@/lib/github";
import { SKILL_CATEGORIES } from "@/lib/skills-data";
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
    const { currentSkills } = await req.json();

    const githubData = await prisma.gitHubData.findUnique({
      where: { userId }
    });

    if (!githubData) {
      return NextResponse.json({ verified: [], unverified: [], suggested: [], cleanedSkills: currentSkills });
    }

    const repos = githubData.repositories as any[];
    const repoBasedSkills = extractDeterministicSkills(repos);
    
    const verified: string[] = [];
    const unverified: string[] = [];
    const currentLower = new Set(Object.values(currentSkills || {}).flat().map((s: any) => s.toLowerCase()));
    
    // Check all deterministic skills against what user has
    const allRepoSkills = [
      ...repoBasedSkills.languages,
      ...repoBasedSkills.frameworks,
      ...repoBasedSkills.tools
    ];

    const repoLower = new Set(allRepoSkills.map(s => s.toLowerCase()));

    // Skills user has but not in repos
    Object.values(currentSkills || {}).flat().forEach((skill: any) => {
      if (repoLower.has(skill.toLowerCase())) {
        verified.push(skill);
      } else {
        unverified.push(skill);
      }
    });

    // Skills in repos but not in user's list
    const suggested = {
      languages: repoBasedSkills.languages.filter(s => !currentLower.has(s.toLowerCase())),
      frameworks: repoBasedSkills.frameworks.filter(s => !currentLower.has(s.toLowerCase())),
      tools: repoBasedSkills.tools.filter(s => !currentLower.has(s.toLowerCase())),
    };

    // Build clean verified skill set split by category
    const cleanedSkills: { languages: string[]; frameworks: string[]; tools: string[] } = {
      languages: [], frameworks: [], tools: []
    };

    // Helper to add skill to correct category
    const addSkill = (skill: string) => {
      const cat = SKILL_CATEGORIES[skill] || "tools";
      if (!cleanedSkills[cat].find(s => s.toLowerCase() === skill.toLowerCase())) {
        cleanedSkills[cat].push(skill);
      }
    };

    // Auto-Integrity: Only keep verified skills
    for (const skill of verified) addSkill(skill);
    
    // We do NOT add aiSkills here to prevent pollution - only deterministic repo skills
    // Suggestions are returned separately for the user to review

    return NextResponse.json({
      verified,
      unverified,
      suggested,
      cleanedSkills
    });
  } catch (error: any) {
    console.error("[VALIDATE-SKILLS] Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
