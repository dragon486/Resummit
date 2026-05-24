import { auth } from "@/auth";
import { prisma, resolveUserId } from "@/lib/server/prisma";
import { NextResponse } from "next/server";
import { suggestSkillsFromGitHub } from "@/lib/aiService";
import { extractDeterministicSkills, fetchUserRepos, discoverSkillsFromGitHubCodebases } from "@/lib/github";
import { SKILL_CATEGORIES } from "@/lib/skills-data";
import { runSmartSync } from "@/lib/suggestionEngine";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  projects: z.array(z.any()).optional(),
  existing: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = await resolveUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projects = [], existing = [] } = schema.parse(body);

    // Pull stored GitHub data (repos with languages, topics, READMEs)
    const githubData = await prisma.gitHubData.findUnique({
      where: { userId },
      select: { repositories: true, accessToken: true }
    });

    const token = (session?.user as any)?.accessToken || githubData?.accessToken;
    let repos: any[] = [];
    
    if (token) {
      try {
        console.log("[SKILLS] Fetching fresh repositories dynamically from GitHub API (including practice/tutorials)...");
        repos = await fetchUserRepos(token, true);
        
        // Asynchronously update the cache database in the background so other features benefit
        prisma.gitHubData.upsert({
          where: { userId },
          update: { repositories: repos.slice(0, 50) as any, lastSyncedAt: new Date() },
          create: { userId, repositories: repos.slice(0, 50) as any, lastSyncedAt: new Date() }
        }).catch((e: any) => console.error("[SKILLS] Background database cache sync failed:", e));
      } catch (err) {
        console.error("[SKILLS] Failed to retrieve dynamic GitHub repositories, falling back to database cache:", err);
        repos = Array.isArray(githubData?.repositories) ? githubData.repositories : [];
      }
    } else {
      repos = Array.isArray(githubData?.repositories) ? githubData.repositories : [];
    }

    // Step 1: Deterministic extraction from repo metadata (language + topics)
    const deterministic = extractDeterministicSkills(repos);

    // Step 1b: Deep scan repository codebases (package.json, requirements.txt) dynamically in parallel!
    let codebaseSkills: { languages: string[]; frameworks: string[]; tools: string[] } = { languages: [], frameworks: [], tools: [] };
    if (token) {
      try {
        console.log("[SKILLS] Scanning top codebases dynamically for package/library dependencies...");
        codebaseSkills = await discoverSkillsFromGitHubCodebases(token, repos);
      } catch (err) {
        console.error("[SKILLS] Codebase dependency discovery scan failed:", err);
      }
    }

    // Lower the frequency bar for READMEs — a skill appearing in 1 repo with a README counts
    const readmeSkills = extractSkillsFromReadmes(repos);

    // Merge metadata, codebase, and readme results!
    const mergedDeterministic = mergeSkillSets([deterministic, codebaseSkills, readmeSkills]);

    // Step 2: AI enhancement — pass rich repo context for deeper extraction
    const repoContext = repos.slice(0, 20).map((r: any) => ({
      name: r.name,
      language: r.language,
      description: r.description,
      topics: r.topics || [],
      readme: (r.readme || "").slice(0, 800), // cap per-repo readme
    }));

    let aiSuggested: { languages: string[]; frameworks: string[]; tools: string[] } = { languages: [], frameworks: [], tools: [] };
    try {
      aiSuggested = await suggestSkillsFromGitHub(repoContext, projects, existing);
    } catch (aiErr) {
      console.warn("[SKILLS] AI suggestion failed (probably quota exceeded), falling back to deterministic extraction:", aiErr);
    }

    // Step 3: Merge everything, deduplicating case-insensitively
    const final = mergeSkillSets([mergedDeterministic, aiSuggested], existing);

    return NextResponse.json({ skills: final, source: "github+ai" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Skill Suggestion Error:", error);
    return NextResponse.json({ error: error.message || "Failed to suggest skills" }, { status: 500 });
  }
}

/** Extract skills mentioned in README text using the known SKILL_MAP keywords */
function extractSkillsFromReadmes(repos: any[]): { languages: string[]; frameworks: string[]; tools: string[] } {
  // Build a regex-based keyword scanner from SKILL_CATEGORIES keys
  const result: Record<string, Set<string>> = { languages: new Set(), frameworks: new Set(), tools: new Set() };
  
  // Common tech keywords to scan for in READMEs
  const techKeywords: Record<string, string> = {
    "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript",
    "node": "Node.js", "react": "React", "nextjs": "Next.js", "next.js": "Next.js",
    "express": "Express.js", "flask": "Flask", "fastapi": "FastAPI", "django": "Django",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch", "keras": "Keras",
    "postgresql": "PostgreSQL", "postgres": "PostgreSQL", "mongodb": "MongoDB",
    "mysql": "MySQL", "redis": "Redis", "firebase": "Firebase",
    "docker": "Docker", "kubernetes": "Kubernetes", "aws": "AWS", "gcp": "GCP",
    "azure": "Azure", "graphql": "GraphQL", "git": "Git", "tailwind": "Tailwind CSS",
    "prisma": "Prisma", "vue": "Vue.js", "angular": "Angular", "flutter": "Flutter",
    "supabase": "Supabase", "openai": "OpenAI GPT-4o-mini", "langchain": "LangChain",
    "streamlit": "Streamlit", "celery": "Celery",
    "selenium": "Selenium", "playwright": "Playwright", "jest": "Jest",
    "spring": "Spring Boot", "java": "Java", "kotlin": "Kotlin", "go": "Go",
    "rust": "Rust", "c++": "C++", "c#": "C#", "php": "PHP", "ruby": "Ruby",
    "bash": "Bash", "shell": "Shell", "terraform": "Terraform", "ansible": "Ansible",
    "kafka": "Apache Kafka", "spark": "Apache Spark", "elasticsearch": "Elasticsearch",
  };

  for (const repo of repos) {
    const readme = (repo.readme || "").toLowerCase();
    if (!readme) continue;

    for (const [keyword, formalName] of Object.entries(techKeywords)) {
      const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(readme)) {
        const cat = SKILL_CATEGORIES[formalName] || "tools";
        if (result[cat]) result[cat].add(formalName);
      }
    }
  }

  return {
    languages: Array.from(result.languages),
    frameworks: Array.from(result.frameworks),
    tools: Array.from(result.tools),
  };
}

/** Merge multiple skill sets, deduplicating case-insensitively, excluding existing skills */
function mergeSkillSets(
  sets: Array<{ languages: string[]; frameworks: string[]; tools: string[] }>,
  exclude: string[] = []
): { languages: string[]; frameworks: string[]; tools: string[] } {
  const excludeLower = new Set(exclude.map(s => s.toLowerCase()));
  const result: Record<string, Set<string>> = {
    languages: new Set(), frameworks: new Set(), tools: new Set()
  };

  for (const set of sets) {
    for (const cat of ["languages", "frameworks", "tools"] as const) {
      for (const skill of (set[cat] || [])) {
        if (skill && !excludeLower.has(skill.toLowerCase())) {
          result[cat].add(skill);
        }
      }
    }
  }

  return {
    languages: Array.from(result.languages),
    frameworks: Array.from(result.frameworks),
    tools: Array.from(result.tools),
  };
}
