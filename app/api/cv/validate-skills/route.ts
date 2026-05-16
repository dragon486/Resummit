import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { extractDeterministicSkills } from "@/lib/github";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cv/validate-skills
 * Cross-references the user's current skill list against their actual GitHub repos.
 * Returns:
 *   - verified: skills backed by ≥2 repos
 *   - unverified: skills NOT found in any repo
 *   - suggested: skills found in repos but not currently listed
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentSkills } = await req.json();

    // Fetch stored repos from GitHubData
    const githubData = await prisma.gitHubData.findUnique({
      where: { userId: session.user.id },
    });

    if (!githubData?.repositories) {
      return NextResponse.json({
        requiresSync: true,
        message: "No GitHub data found. Please run a GitHub sync first.",
      });
    }

    // Parse stored repos
    let repos: any[] = [];
    try {
      repos = Array.isArray(githubData.repositories)
        ? githubData.repositories
        : JSON.parse(githubData.repositories as any);
    } catch {
      repos = [];
    }

    if (repos.length === 0) {
      return NextResponse.json({
        requiresSync: true,
        message: "No repos in GitHub data.",
      });
    }

    // Run weighted skill extraction on real repos
    const repoBasedSkills = extractDeterministicSkills(repos);
    const repoSkillSet = new Set([
      ...repoBasedSkills.languages,
      ...repoBasedSkills.frameworks,
      ...repoBasedSkills.tools,
    ].map(s => s.toLowerCase()));

    // Also build a raw mention set (frequency ≥ 1, not just ≥ 2) for partial credit
    const rawMentionSet = new Set<string>();
    for (const repo of repos) {
      if (repo.language) rawMentionSet.add(repo.language.toLowerCase());
      const text = [repo.description || "", ...(repo.topics || [])].join(" ").toLowerCase();
      // Check for any known technology mention
      const techPatterns = [
        "python", "javascript", "typescript", "java", "go", "rust", "kotlin", "swift",
        "react", "next", "node", "express", "flask", "django", "fastapi", "streamlit",
        "tensorflow", "pytorch", "postgres", "mongodb", "mysql", "redis", "firebase",
        "aws", "gcp", "docker", "kubernetes", "graphql", "tailwind", "prisma",
        "angular", "vue", "spring", "rails", "kafka", "airflow",
      ];
      for (const pat of techPatterns) {
        if (text.includes(pat)) rawMentionSet.add(pat);
      }
    }

    // Categorize each current skill
    const allCurrentSkills = [
      ...(currentSkills.languages || []),
      ...(currentSkills.frameworks || []),
      ...(currentSkills.tools || []),
    ];

    const verified: string[] = [];
    const unverified: string[] = [];

    for (const skill of allCurrentSkills) {
      const skillLow = skill.toLowerCase();
      // Verified if backed by ≥2 repos
      const isVerified = repoSkillSet.has(skillLow);
      // Soft-verified: mentioned in at least 1 repo (partial credit)
      const isSoftVerified = rawMentionSet.has(skillLow) || 
        [...rawMentionSet].some(r => r.includes(skillLow) || skillLow.includes(r));

      if (isVerified || isSoftVerified) {
        verified.push(skill);
      } else {
        unverified.push(skill);
      }
    }

    // Suggested: in repos but not currently listed
    const currentLower = new Set(allCurrentSkills.map(s => s.toLowerCase()));
    const suggested = {
      languages: repoBasedSkills.languages.filter(s => !currentLower.has(s.toLowerCase())),
      frameworks: repoBasedSkills.frameworks.filter(s => !currentLower.has(s.toLowerCase())),
      tools: repoBasedSkills.tools.filter(s => !currentLower.has(s.toLowerCase())),
    };

    // Build clean verified skill set split by category
    const CATEGORIES: Record<string, "languages" | "frameworks" | "tools"> = {
      "JavaScript": "languages", "TypeScript": "languages", "Python": "languages",
      "Java": "languages", "C++": "languages", "C": "languages", "Go": "languages",
      "Rust": "languages", "Kotlin": "languages", "Swift": "languages", "Dart": "languages",
      "HTML/CSS": "languages", "HTML": "languages", "CSS": "languages",
      "React": "frameworks", "Next.js": "frameworks", "Node.js": "frameworks",
      "Express.js": "frameworks", "Flask": "frameworks", "FastAPI": "frameworks",
      "Django": "frameworks", "TensorFlow": "frameworks", "PyTorch": "frameworks",
      "Streamlit": "frameworks", "Tailwind CSS": "frameworks", "Prisma": "frameworks",
      "Vue.js": "frameworks", "Angular": "frameworks", "Spring Boot": "frameworks",
      "PostgreSQL": "tools", "MongoDB": "tools", "MySQL": "tools", "Redis": "tools",
      "Firebase": "tools", "AWS": "tools", "GCP": "tools", "Docker": "tools",
      "Kubernetes": "tools", "GraphQL": "tools", "Git": "tools",
    };

    const cleanedSkills: { languages: string[]; frameworks: string[]; tools: string[] } = {
      languages: [], frameworks: [], tools: []
    };

    for (const skill of verified) {
      const cat = CATEGORIES[skill] || "tools";
      if (!cleanedSkills[cat].find(s => s.toLowerCase() === skill.toLowerCase())) {
        cleanedSkills[cat].push(skill);
      }
    }

    return NextResponse.json({
      verified,
      unverified,
      suggested,
      cleanedSkills, // ready-to-apply cleaned version split by category
      repoCount: repos.length,
    });
  } catch (error: any) {
    console.error("[VALIDATE-SKILLS]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
