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

export function isJunkRepo(repo: GithubRepo) {
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

export async function fetchUserRepos(accessToken: string, includeAll: boolean = false): Promise<GithubRepo[]> {
  try {
    const response = await axios.get<GithubRepo[]>("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { sort: "pushed", per_page: 100, direction: "desc" },
    });

    const validRepos = response.data.filter(repo => {
      if (repo.fork) return false;
      if (includeAll) return true;
      return !isJunkRepo(repo);
    });

    // We return top 100 most recently pushed/updated repositories so user's latest committed repos are always included
    return validRepos.sort((a, b) => {
      const timeA = new Date(a.pushed_at || a.updated_at).getTime();
      const timeB = new Date(b.pushed_at || b.updated_at).getTime();
      return timeB - timeA;
    }).slice(0, 100);
  } catch (error: any) {
    console.error("Error fetching GitHub repos:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error("GitHub token expired. Please sign out and sign back in to refresh your connection.");
    }
    throw new Error(`Failed to fetch repositories from GitHub: ${error.response?.data?.message || error.message}`);
  }
}

export const SKILL_MAP: Record<string, string> = {
  // Languages
  "python": "Python",
  "javascript": "JavaScript",
  "typescript": "TypeScript",
  "java": "Java",
  "cpp": "C++",
  "c++": "C++",
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
  "rust": "Rust",
  "csharp": "C#",
  "c#": "C#",
  "sql": "SQL",
  "r": "R",
  "perl": "Perl",
  "haskell": "Haskell",
  "solidity": "Solidity",
  "objective-c": "Objective-C",
  "matlab": "MATLAB",
  "jupyter notebook": "Jupyter Notebook",
  "powershell": "PowerShell",
  "assembly": "Assembly",

  // Frameworks/Libraries
  "react": "React",
  "next": "Next.js",
  "next.js": "Next.js",
  "nextjs": "Next.js",
  "node": "Node.js",
  "node.js": "Node.js",
  "nodejs": "Node.js",
  "express": "Express.js",
  "express.js": "Express.js",
  "expressjs": "Express.js",
  "flask": "Flask",
  "fastapi": "FastAPI",
  "django": "Django",
  "tensorflow": "TensorFlow",
  "pytorch": "PyTorch",
  "keras": "Keras",
  "opencv": "OpenCV",
  "streamlit": "Streamlit",
  "tailwind": "Tailwind CSS",
  "tailwindcss": "Tailwind CSS",
  "tailwind-css": "Tailwind CSS",
  "prisma": "Prisma",
  "vue": "Vue.js",
  "vue.js": "Vue.js",
  "vuejs": "Vue.js",
  "nuxt": "Nuxt.js",
  "nuxtjs": "Nuxt.js",
  "svelte": "Svelte",
  "sveltekit": "SvelteKit",
  "angular": "Angular",
  "spring": "Spring Boot",
  "springboot": "Spring Boot",
  "spring-boot": "Spring Boot",
  "rails": "Ruby on Rails",
  "ruby on rails": "Ruby on Rails",
  "flutter": "Flutter",
  "react-native": "React Native",
  "reactnative": "React Native",
  "bootstrap": "Bootstrap",
  "sass": "Sass",
  "scss": "Sass",
  "jquery": "jQuery",
  "redux": "Redux",
  "apollo": "Apollo",
  "nest": "NestJS",
  "nestjs": "NestJS",
  "sequelize": "Sequelize",
  "mongoose": "Mongoose",
  "typeorm": "TypeORM",
  "scikit-learn": "scikit-learn",
  "numpy": "NumPy",
  "pandas": "Pandas",

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
  "vercel": "Vercel",
  "netlify": "Netlify",
  "heroku": "Heroku",
  "sqlite": "SQLite",
  "sqlite3": "SQLite",
  "mariadb": "MariaDB",
  "dynamodb": "DynamoDB",
  "neo4j": "Neo4j",
  "nginx": "Nginx",
  "apache": "Apache",
  "webpack": "Webpack",
  "vite": "Vite",
  "npm": "npm",
  "yarn": "Yarn",
  "pnpm": "pnpm",
  "eslint": "ESLint",
  "prettier": "Prettier",
  "mocha": "Mocha",
  "cypress": "Cypress",
  "ci/cd": "CI/CD",
  "github actions": "GitHub Actions",
  "github-actions": "GitHub Actions",
  "circleci": "CircleCI",
  "travis ci": "Travis CI",
  "linux": "Linux",
  "unix": "Unix",
  "macos": "macOS",
  "windows": "Windows",
  "postman": "Postman",
};
import { SKILL_CATEGORIES } from "./skills-data";
export { SKILL_CATEGORIES };

function textContainsKeyword(text: string, keyword: string): boolean {
  // If keyword contains non-alphanumeric chars (like +, #, ., -), use a boundary-safe check
  if (/[^a-zA-Z0-9]/.test(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|\\s|[.,;()![\\]{}"'])` + escaped + `(?:$|\\s|[.,;()![\\]{}"'])`, "i");
    return re.test(text);
  } else {
    const re = new RegExp(`\\b${keyword}\\b`, "i");
    return re.test(text);
  }
}

/**
 * Weighted skill extraction.
 * A skill must appear in 1+ repos (as primary language or in description/topics)
 * to be included. Each category capped at 12.
 */
export function extractDeterministicSkills(repos: GithubRepo[]) {
  // skill → number of repos it appears in
  const skillFrequency: Record<string, number> = {};

  for (const repo of repos) {
    const seenInThisRepo = new Set<string>();

    // 1. Primary language counts strongly
    if (repo.language) {
      const mapped = SKILL_MAP[repo.language.toLowerCase()];
      if (mapped && !seenInThisRepo.has(mapped)) {
        skillFrequency[mapped] = (skillFrequency[mapped] || 0) + 2;
        seenInThisRepo.add(mapped);
      }
    }

    // 2. Exact topic matching (extremely robust and handles symbols/non-alphanumeric perfectly)
    if (Array.isArray(repo.topics)) {
      for (const topic of repo.topics) {
        const topicLow = topic.toLowerCase().trim();
        const mapped = SKILL_MAP[topicLow];
        if (mapped && !seenInThisRepo.has(mapped)) {
          skillFrequency[mapped] = (skillFrequency[mapped] || 0) + 1;
          seenInThisRepo.add(mapped);
        }
      }
    }

    // 3. Description keyword scans (using safe boundary-aware regex)
    const descText = (repo.description || "").toLowerCase();
    if (descText) {
      for (const [key, formalName] of Object.entries(SKILL_MAP)) {
        if (seenInThisRepo.has(formalName)) continue;
        if (textContainsKeyword(descText, key)) {
          skillFrequency[formalName] = (skillFrequency[formalName] || 0) + 1;
          seenInThisRepo.add(formalName);
        }
      }
    }
  }

  // Only include skills that appear in at least 1 repo (frequency >= 1)
  const qualifiedSkills = Object.entries(skillFrequency)
    .filter(([, freq]) => freq >= 1)
    .sort((a, b) => b[1] - a[1]) // most-used first
    .map(([skill]) => skill);

  const result: { languages: string[]; frameworks: string[]; tools: string[] } = {
    languages: [],
    frameworks: [],
    tools: [],
  };

  for (const skill of qualifiedSkills) {
    const cat = SKILL_CATEGORIES[skill] || "tools";
    if (result[cat].length < 12) { // cap each category at 12
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

/**
 * Fetch the contents of a file from a repository using GitHub Contents API.
 * Returns raw text, or empty string if it fails or doesn't exist.
 */
async function fetchRepoFileContent(
  accessToken: string,
  owner: string,
  repoName: string,
  path: string
): Promise<string> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.raw", // Get raw text directly
        },
        responseType: "text",
        timeout: 4000,
      }
    );
    return typeof response.data === "string" ? response.data : "";
  } catch {
    return "";
  }
}

/** Parse package.json dependencies and search for known technologies in SKILL_MAP */
function extractSkillsFromPackageJson(content: string): string[] {
  try {
    const parsed = JSON.parse(content);
    const deps = {
      ...(parsed.dependencies || {}),
      ...(parsed.devDependencies || {}),
    };
    
    const foundSkills: string[] = [];
    for (const depName of Object.keys(deps)) {
      const lowDep = depName.toLowerCase().trim();
      
      // 1. Direct match
      if (SKILL_MAP[lowDep]) {
        foundSkills.push(SKILL_MAP[lowDep]);
      } else {
        // 2. Substring match for types and wrappers (e.g. @types/react or react-dom or @prisma/client)
        for (const [key, formalName] of Object.entries(SKILL_MAP)) {
          if (lowDep.includes(key) && key.length > 3) {
            foundSkills.push(formalName);
            break;
          }
        }
      }
    }
    return foundSkills;
  } catch {
    return [];
  }
}

/** Parse requirements.txt dependencies and search for known technologies in SKILL_MAP */
function extractSkillsFromRequirementsTxt(content: string): string[] {
  const foundSkills: string[] = [];
  const lines = content.split(/\r?\n/);
  
  for (const line of lines) {
    // Strip comments and version constraints (e.g. numpy>=1.20)
    const cleanLine = line.split(/[#=<>~]/)[0].trim().toLowerCase();
    if (!cleanLine) continue;
    
    if (SKILL_MAP[cleanLine]) {
      foundSkills.push(SKILL_MAP[cleanLine]);
    } else {
      // Substring match
      for (const [key, formalName] of Object.entries(SKILL_MAP)) {
        if (cleanLine.includes(key) && key.length > 3) {
          foundSkills.push(formalName);
          break;
        }
      }
    }
  }
  return foundSkills;
}

/**
 * Parallel-scans the repository codebases (package.json and requirements.txt)
 * to dynamically extract frameworks, libraries, databases, and tools.
 */
export async function discoverSkillsFromGitHubCodebases(
  accessToken: string,
  repos: GithubRepo[]
): Promise<{ languages: string[]; frameworks: string[]; tools: string[] }> {
  const result: Record<string, Set<string>> = { languages: new Set(), frameworks: new Set(), tools: new Set() };
  
  // scan top 15 most recently pushed repositories
  const topRepos = repos.slice(0, 15);
  
  await Promise.all(
    topRepos.map(async (repo) => {
      const owner = repo.owner?.login;
      if (!owner) return;
      
      const lang = (repo.language || "").toLowerCase();
      
      // 1. JS/TS repositories -> scan package.json
      if (["javascript", "typescript"].includes(lang) || repo.name.toLowerCase().includes("js") || repo.name.toLowerCase().includes("node")) {
        const content = await fetchRepoFileContent(accessToken, owner, repo.name, "package.json");
        if (content) {
          const skills = extractSkillsFromPackageJson(content);
          for (const s of skills) {
            const cat = SKILL_CATEGORIES[s] || "tools";
            result[cat].add(s);
          }
        }
      }
      
      // 2. Python/Notebook repositories -> scan requirements.txt
      if (["python"].includes(lang) || repo.name.toLowerCase().includes("py") || lang.includes("jupyter")) {
        const content = await fetchRepoFileContent(accessToken, owner, repo.name, "requirements.txt");
        if (content) {
          const skills = extractSkillsFromRequirementsTxt(content);
          for (const s of skills) {
            const cat = SKILL_CATEGORIES[s] || "tools";
            result[cat].add(s);
          }
        }
      }
    })
  );
  
  return {
    languages: Array.from(result.languages),
    frameworks: Array.from(result.frameworks),
    tools: Array.from(result.tools),
  };
}


