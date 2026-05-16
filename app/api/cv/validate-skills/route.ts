import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { extractDeterministicSkills } from "@/lib/github";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentSkills } = await req.json();

    // RESOLVE CORRECT USER ID VIA EMAIL
    const dbUser = await prisma.user.findUnique({ 
      where: { email },
      include: { githubData: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = dbUser.id;
    let githubData = dbUser.githubData;

    const token = (session.user as any).accessToken || githubData?.accessToken;

    if ((!githubData?.repositories || (githubData.repositories as any).length === 0) && token) {
      console.log("[VALIDATE-SKILLS] No data found but token exists. Triggering auto-sync...");
      const { runSmartSync } = await import("@/lib/suggestionEngine");
      await runSmartSync(userId, token, email);
      
      githubData = await prisma.gitHubData.findUnique({
        where: { userId },
      });
    }

    if (!githubData?.repositories) {
      return NextResponse.json({
        requiresSync: true,
        message: "No GitHub data found.",
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

    // Fetch high-confidence skill suggestions to merge
    const aiSuggestions = await prisma.suggestion.findMany({
      where: { 
        userId: userId, 
        type: "ADD_SKILL",
        status: "PENDING",
        confidence: { gte: 0.7 }
      }
    });
    
    // Extract actual skill names from proposedData (JSON) or fallback to title
    const aiSkills: string[] = [];
    for (const sug of aiSuggestions) {
      try {
        const data = JSON.parse(sug.proposedData);
        const skills = [
          ...(data.languages || []),
          ...(data.frameworks || []),
          ...(data.tools || [])
        ];
        aiSkills.push(...skills);
      } catch (e) {
        // Fallback: strip "New Skills: " prefix if title is used
        aiSkills.push(sug.title.replace(/^New Skills:\s+/i, "").replace(/\.\.\.$/, ""));
      }
    }

    // Run weighted skill extraction on real repos
    const repoBasedSkills = extractDeterministicSkills(repos);
    const repoSkillSet = new Set([
      ...repoBasedSkills.languages,
      ...repoBasedSkills.frameworks,
      ...repoBasedSkills.tools,
    ].map(s => s.toLowerCase()));

    // Combine deterministic skills with high-confidence AI detected skills
    const combinedVerifiedSet = new Set([
      ...Array.from(repoSkillSet),
      ...aiSkills.map(s => s.toLowerCase())
    ]);

    const allCurrentSkills = [
      ...(currentSkills.languages || []),
      ...(currentSkills.frameworks || []),
      ...(currentSkills.tools || []),
    ];

    const verified: string[] = [];
    const unverified: string[] = [];

    for (const skill of allCurrentSkills) {
      const skillLow = skill.toLowerCase();
      if (combinedVerifiedSet.has(skillLow)) {
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

    // Cleaned set
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
      "OpenCV": "frameworks", "Jupyter Notebook": "tools", "Slack": "tools", "Boltic": "tools"
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
    
    for (const skill of aiSkills) {
      const cat = CATEGORIES[skill] || "tools";
      if (!cleanedSkills[cat].find(s => s.toLowerCase() === skill.toLowerCase())) {
        cleanedSkills[cat].push(skill);
      }
    }

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
