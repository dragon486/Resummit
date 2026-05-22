import axios from "axios";

export interface GithubRepo {
  id: number;
  name: string;
  full_name?: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count?: number;
  updated_at: string;
  pushed_at?: string;
  fork: boolean;
  language: string | null;
  topics?: string[];
  // Enriched after fetch
  readme?: string;
  owner?: { login: string };
}

/**
 * Fetch the README for a specific repo, returning plain text truncated to ~1500 chars.
 * Returns empty string if no README exists or fetch fails.
 */
export async function fetchRepoReadme(
  accessToken: string,
  owner: string,
  repoName: string
): Promise<string> {
  try {
    // The Contents API returns base64-encoded content
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/readme`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.raw", // get raw text directly
        },
        responseType: "text",
        timeout: 5000,
      }
    );
    const raw: string = typeof response.data === "string" ? response.data : "";
    // Strip markdown images/links, keep text content, truncate
    const cleaned = raw
      .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // inline links → label only
      .replace(/#{1,6}\s/g, "") // remove heading hashes
      .replace(/```[\s\S]*?```/g, "") // remove code blocks
      .replace(/`[^`]+`/g, "") // remove inline code
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.slice(0, 1500);
  } catch {
    return "";
  }
}

function normalize(name: string) {
  return name.toLowerCase().replace(/[-_0-9]/g, "").trim();
}

function daysSince(dateString: string) {
  return (Date.now() - new Date(dateString).getTime()) / (1000 * 3600 * 24);
}

function isJunkRepo(repo: GithubRepo) {
  if (repo.fork) return true;

  const n = normalize(repo.name);
  const desc = (repo.description || "").toLowerCase();

  const junkPatterns = [
    /^test/,
    /^demo/,
    /^practice/,
    /^temp/,
    /^repo$/,
    /^project$/,
    /^javascript$/,
    /^practice/,
    /tutorial/
  ];

  const lowSignal = !repo.language && desc.length === 0;

  const isJunkName = junkPatterns.some((p) => p.test(n));

  return isJunkName || lowSignal;
}

function scoreRepo(repo: GithubRepo) {
  const recencyScore = Math.max(0, 450 - daysSince(repo.updated_at)) / 10;
  
  // Keyword Bonus: +1 per high-signal term, max 5.
  const desc = (repo.description || "").toLowerCase();
  const keywords = ["ml", "ai", "api", "cloud", "system", "automation", "dashboard", "fullstack", "backend"];
  const kwBonus = Math.min(5, keywords.filter(kw => desc.includes(kw)).length);

  return (
    (repo.stargazers_count || 0) * 2 + // user feedback: stars weight * 2
    ((repo as any).forks_count || 0) * 2 +
    (repo.description?.length || 0) * 0.1 +
    recencyScore +
    kwBonus
  );
}

export async function fetchUserRepos(accessToken: string): Promise<GithubRepo[]> {
  try {
    const response = await axios.get<GithubRepo[]>("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { sort: "pushed", per_page: 100, direction: "desc" },
    });

    const validRepos = response.data.filter(repo => !isJunkRepo(repo));

    // We return top 50 most recently pushed/updated repositories so user's latest committed repos are always included
    return validRepos.sort((a, b) => {
      const timeA = new Date(a.pushed_at || a.updated_at).getTime();
      const timeB = new Date(b.pushed_at || b.updated_at).getTime();
      return timeB - timeA;
    }).slice(0, 50);
  } catch (error: any) {
    console.error("Error fetching GitHub repos:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error("GitHub token expired. Please sign out and sign back in to refresh your connection.");
    }
    throw new Error(`Failed to fetch repositories from GitHub: ${error.response?.data?.message || error.message}`);
  }
}

const SKILL_MAP: Record<string, string> = {
  // Languages — only mainstream ones worth listing on a CV
  "python": "Python",
  "javascript": "JavaScript",
  "typescript": "TypeScript",
  "java": "Java",
  "cpp": "C++",
  "cplusplus": "C++",
  "c": "C",
  "go": "Go",
  "golang": "Go",
  "kotlin": "Kotlin",
  "swift": "Swift",
  "dart": "Dart",
  "ruby": "Ruby",
  "php": "PHP",
  "scala": "Scala",
  "shell": "Shell",
  "bash": "Bash",
  "html": "HTML/CSS",
  "css": "HTML/CSS",

  // Frameworks/Libraries
  "react": "React",
  "next": "Next.js",
  "nextjs": "Next.js",
  "node": "Node.js",
  "nodejs": "Node.js",
  "express": "Express.js",
  "flask": "Flask",
  "fastapi": "FastAPI",
  "django": "Django",
  "tensorflow": "TensorFlow",
  "pytorch": "PyTorch",
  "keras": "Keras",
  "opencv": "OpenCV",
  "streamlit": "Streamlit",
  "tailwind": "Tailwind CSS",
  "prisma": "Prisma",
  "vue": "Vue.js",
  "vuejs": "Vue.js",
  "angular": "Angular",
  "spring": "Spring Boot",
  "springboot": "Spring Boot",
  "rails": "Ruby on Rails",
  "flutter": "Flutter",
  "react-native": "React Native",

  // Tools/Cloud/DB
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "mongodb": "MongoDB",
  "mysql": "MySQL",
  "redis": "Redis",
  "firebase": "Firebase",
  "supabase": "Supabase",
  "aws": "AWS",
  "gcp": "GCP",
  "azure": "Azure",
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  "graphql": "GraphQL",
  "git": "Git",
  "github": "Git",
  "jenkins": "Jenkins",
  "terraform": "Terraform",
  "ansible": "Ansible",
  "kafka": "Apache Kafka",
  "airflow": "Apache Airflow",
  "spark": "Apache Spark",
  "hadoop": "Hadoop",
  "elasticsearch": "Elasticsearch",
  "prometheus": "Prometheus",
  "grafana": "Grafana",
  "selenium": "Selenium",
  "playwright": "Playwright",
  "jest": "Jest",
};
import { SKILL_CATEGORIES } from "./skills-data";
export { SKILL_CATEGORIES };

/**
 * Weighted skill extraction.
 * A skill must appear in 2+ repos (as primary language or in description/topics)
 * to be included. This prevents listing Rust/Haskell from a single tutorial repo.
 * Each category capped at 8.
 */
export function extractDeterministicSkills(repos: GithubRepo[]) {
  // skill → number of repos it appears in
  const skillFrequency: Record<string, number> = {};

  for (const repo of repos) {
    const seenInThisRepo = new Set<string>();

    // Primary language counts strongly (weight 2 = equivalent to 2 repos)
    if (repo.language) {
      const mapped = SKILL_MAP[repo.language.toLowerCase()];
      if (mapped && !seenInThisRepo.has(mapped)) {
        skillFrequency[mapped] = (skillFrequency[mapped] || 0) + 2;
        seenInThisRepo.add(mapped);
      }
    }

    // Description and topics count (weight 1 each)
    const text = [
      repo.description || "",
      ...(repo.topics || []),
    ].join(" ").toLowerCase();

    for (const [key, formalName] of Object.entries(SKILL_MAP)) {
      if (seenInThisRepo.has(formalName)) continue;
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escapedKey}\\b`, "i");
      if (re.test(text)) {
        skillFrequency[formalName] = (skillFrequency[formalName] || 0) + 1;
        seenInThisRepo.add(formalName);
      }
    }
  }

  // Only include skills that appear in the equivalent of 2+ repos (frequency >= 2)
  const qualifiedSkills = Object.entries(skillFrequency)
    .filter(([, freq]) => freq >= 2)
    .sort((a, b) => b[1] - a[1]) // most-used first
    .map(([skill]) => skill);

  const result: { languages: string[]; frameworks: string[]; tools: string[] } = {
    languages: [],
    frameworks: [],
    tools: [],
  };

  for (const skill of qualifiedSkills) {
    const cat = SKILL_CATEGORIES[skill] || "tools";
    if (result[cat].length < 8) { // cap each category at 8
      result[cat].push(skill);
    }
  }

  return result;
}

/**
 * Detect common CV text quality issues.
 * Returns a list of human-readable warnings.
 */
export function validateCVText(text: string): string[] {
  const issues: string[] = [];

  // Duplicate consecutive words like "Software Software"
  const dupMatch = text.match(/\b(\w+)\s+\1\b/gi);
  if (dupMatch) {
    issues.push(`Duplicate word(s): ${[...new Set(dupMatch)].join(", ")}`);
  }

  // Generic placeholder phrases
  const placeholders = [
    "Achieved X by implementing Y",
    "Lorem ipsum",
    "Your Name",
    "Company Name",
  ];
  for (const ph of placeholders) {
    if (text.toLowerCase().includes(ph.toLowerCase())) {
      issues.push(`Placeholder text found: "${ph}"`);
    }
  }

  return issues;
}

