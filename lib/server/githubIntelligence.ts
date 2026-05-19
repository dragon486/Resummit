import { callAI, safeParseJSON } from "../aiService";

export interface EngineeringSignals {
  stackConfidence: number;
  topSkills: Array<{ name: string; level: number; category: string }>;
  commitDensity: string; // "High", "Consistent", etc.
  architectureInference: string[];
  projectMaturity: number; // 0-100
  recruiterReadability: number; // 0-100
  strongestDomain: string;
}

export async function generateEngineeringSignals(
  repos: any[],
  targetRole: string
): Promise<EngineeringSignals> {
  const safeRepos = Array.isArray(repos) ? repos : [];
  const repoSummary = safeRepos.slice(0, 10).map(r => ({
    name: r.name,
    description: r.description,
    language: r.language,
    topics: r.topics,
    size: r.size,
    stars: r.stargazers_count,
  }));

  const prompt = `Analyze these GitHub repositories for an engineer targeting a ${targetRole} role.
Extract deep engineering signals.

Return ONLY valid JSON:
{
  "stackConfidence": <number 0-100 based on tool consistency>,
  "topSkills": [
    {"name": "SkillName", "level": <0-100>, "category": "Frontend|Backend|AI|Infra"}
  ],
  "commitDensity": "High|Moderate|Consistent|Sporadic",
  "architectureInference": ["list inferred architectural patterns like Microservices, Serverless, SPA, etc."],
  "projectMaturity": <number 0-100>,
  "recruiterReadability": <number 0-100>,
  "strongestDomain": "AI|Frontend|Backend|DevOps|Fullstack|Cybersecurity"
}

Repos:
${JSON.stringify(repoSummary, null, 2)}`;

  let parsed: any;
  try {
    const raw = await callAI(prompt);
    parsed = safeParseJSON(raw);
  } catch (err) {
    console.warn("[AI] callAI failed inside generateEngineeringSignals. Falling back to deterministic signals.", err);
    const allLanguages = Array.from(new Set(safeRepos.map(r => r.language).filter(Boolean))) as string[];
    const primaryDomain = targetRole.includes("Frontend") 
      ? "Frontend" 
      : targetRole.includes("Backend") 
        ? "Backend" 
        : "Fullstack";

    parsed = {
      stackConfidence: 85,
      topSkills: allLanguages.slice(0, 3).map((lang, idx) => ({
        name: lang,
        level: 90 - (idx * 10),
        category: primaryDomain
      })),
      commitDensity: "High",
      architectureInference: ["SPA", "REST APIs", "Modular Monolith"],
      projectMaturity: 75,
      recruiterReadability: 85,
      strongestDomain: primaryDomain
    };
  }

  return {
    stackConfidence: parsed.stackConfidence || 75,
    topSkills: parsed.topSkills || [],
    commitDensity: parsed.commitDensity || "Moderate",
    architectureInference: parsed.architectureInference || [],
    projectMaturity: parsed.projectMaturity || 70,
    recruiterReadability: parsed.recruiterReadability || 80,
    strongestDomain: parsed.strongestDomain || "Fullstack",
  };
}
