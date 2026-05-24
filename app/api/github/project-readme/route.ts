import { auth } from "@/auth";
import { prisma, resolveUserId } from "@/lib/server/prisma";
import { fetchRepoReadme } from "@/lib/github";
import { callAI, safeParseJSON } from "@/lib/aiService";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = await resolveUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { repoName, techStack } = await req.json();
    if (!repoName) {
      return NextResponse.json({ error: "Missing repoName" }, { status: 400 });
    }

    const githubData = await prisma.gitHubData.findUnique({
      where: { userId }
    });

    const token = (session.user as any).accessToken || githubData?.accessToken;
    if (!token) {
      return NextResponse.json({ error: "GitHub account not connected" }, { status: 400 });
    }

    // Attempt to discover repository owner login from the stored list
    let ownerLogin = "";
    const storedRepos: any[] = Array.isArray(githubData?.repositories)
      ? githubData!.repositories
      : typeof githubData?.repositories === "string"
      ? JSON.parse(githubData!.repositories as any)
      : [];

    const matchedRepo = storedRepos.find(
      (r) => r.name.toLowerCase() === repoName.toLowerCase()
    );

    if (matchedRepo?.owner?.login) {
      ownerLogin = matchedRepo.owner.login;
    } else if (storedRepos[0]?.owner?.login) {
      ownerLogin = storedRepos[0].owner.login;
    } else {
      // Fallback: Fetch user info from GitHub API directly if needed
      try {
        const userRes = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await userRes.json();
        ownerLogin = userData.login || "";
      } catch {
        ownerLogin = "";
      }
    }

    if (!ownerLogin) {
      return NextResponse.json({ error: "Could not resolve GitHub owner login" }, { status: 400 });
    }

    // Fetch the raw README content using our lib function
    const readme = await fetchRepoReadme(token, ownerLogin, repoName);
    
    // Construct rich context prompt for the AI model
    const prompt = `You are a recruiter-grade technical resume optimizer.
Given a GitHub project name, its tech stack, and its README content, generate:
1. A concise, 1-sentence professional technical description of what the project does.
2. Exactly 2 recruiter-grade engineering highlights (bullet points).

Project Name: ${repoName}
Tech Stack: ${Array.isArray(techStack) ? techStack.join(", ") : techStack || "Python"}
README Excerpt:
${readme ? readme.slice(0, 1500) : "No README available. Base your response purely on the project name and tech stack."}

Rules:
- No buzzwords: leveraged, robust, scalable, utilized, streamlined, spearheaded, cutting-edge.
- No adjectives: passionate, dedicated, dynamic, innovative.
- Impact Forcing: Every highlight MUST include an action, technical implementation details using the tech stack, and a result or observable benefit (e.g. 'automated sequence prediction').
- Return ONLY valid JSON:
{
  "description": "...",
  "highlights": [
    "Highlight bullet 1",
    "Highlight bullet 2"
  ]
}`;

    let result: any = {};
    try {
      const aiResponse = await callAI(prompt);
      result = safeParseJSON(aiResponse);
    } catch (e) {
      console.warn("[PROJECT-README] AI processing failed. Falling back to deterministic project generation.", e);
      const language = Array.isArray(techStack) && techStack.length > 0 ? techStack[0] : "TypeScript";
      const techList = Array.isArray(techStack) && techStack.length > 0 ? techStack.slice(0, 3) : ["Node.js", "Git"];
      result = {
        description: `High-performance modular project developed using ${language} to streamline core application logic.`,
        highlights: [
          `Engineered ${repoName} utilizing ${language} to enhance system throughput and resolve data processing latency.`,
          `Integrated ${techList.join(', ')} architectures to automate integration checks and optimize deployment workflows.`
        ]
      };
    }

    return NextResponse.json({
      success: true,
      description: result.description || "Project built with modern technologies.",
      highlights: Array.isArray(result.highlights) ? result.highlights.slice(0, 2) : []
    });

  } catch (error: any) {
    console.error("[PROJECT-README] Error generating project from README:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
