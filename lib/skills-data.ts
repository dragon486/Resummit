export const SKILL_CATEGORIES: Record<string, "languages" | "frameworks" | "tools"> = {
  // Languages
  "JavaScript": "languages", "TypeScript": "languages", "Python": "languages",
  "Java": "languages", "C++": "languages", "C": "languages", "Go": "languages",
  "Kotlin": "languages", "Swift": "languages", "Dart": "languages",
  "Ruby": "languages", "PHP": "languages", "Scala": "languages",
  "HTML/CSS": "languages", "Shell": "languages", "Bash": "languages",
  "Rust": "languages", "C#": "languages", "SQL": "languages", "R": "languages",
  "Perl": "languages", "Haskell": "languages", "Solidity": "languages",
  "Objective-C": "languages", "MATLAB": "languages", "Jupyter Notebook": "languages",
  "PowerShell": "languages", "Assembly": "languages",

  // Frameworks
  "React": "frameworks", "Next.js": "frameworks", "Node.js": "frameworks",
  "Express.js": "frameworks", "Flask": "frameworks", "FastAPI": "frameworks",
  "Django": "frameworks", "TensorFlow": "frameworks", "PyTorch": "frameworks",
  "Keras": "frameworks", "OpenCV": "frameworks", "Streamlit": "frameworks",
  "Tailwind CSS": "frameworks", "Prisma": "frameworks", "Vue.js": "frameworks",
  "Angular": "frameworks", "Spring Boot": "frameworks", "Ruby on Rails": "frameworks",
  "Flutter": "frameworks", "React Native": "frameworks",
  "Nuxt.js": "frameworks", "Svelte": "frameworks", "SvelteKit": "frameworks",
  "Bootstrap": "frameworks", "Sass": "frameworks", "jQuery": "frameworks",
  "Redux": "frameworks", "Apollo": "frameworks", "NestJS": "frameworks",
  "Sequelize": "frameworks", "Mongoose": "frameworks", "TypeORM": "frameworks",
  "scikit-learn": "frameworks", "NumPy": "frameworks", "Pandas": "frameworks",

  // Tools & DB
  "PostgreSQL": "tools", "MongoDB": "tools", "MySQL": "tools", "Redis": "tools",
  "Firebase": "tools", "Supabase": "tools", "AWS": "tools", "GCP": "tools",
  "Azure": "tools", "Docker": "tools", "Kubernetes": "tools", "GraphQL": "tools",
  "Git": "tools", "Jenkins": "tools", "Terraform": "tools", "Ansible": "tools",
  "Apache Kafka": "tools", "Apache Airflow": "tools", "Apache Spark": "tools",
  "Elasticsearch": "tools", "Prometheus": "tools", "Grafana": "tools",
  "Selenium": "tools", "Playwright": "tools", "Jest": "tools",
  "Vercel": "tools", "Netlify": "tools", "Heroku": "tools",
  "SQLite": "tools", "MariaDB": "tools", "DynamoDB": "tools",
  "Neo4j": "tools", "Nginx": "tools", "Apache": "tools",
  "Webpack": "tools", "Vite": "tools", "npm": "tools",
  "Yarn": "tools", "pnpm": "tools", "ESLint": "tools",
  "Prettier": "tools", "Mocha": "tools", "Cypress": "tools",
  "CI/CD": "tools", "GitHub Actions": "tools", "CircleCI": "tools",
  "Travis CI": "tools", "Linux": "tools", "Unix": "tools",
  "macOS": "tools", "Windows": "tools", "Postman": "tools",
};

export function normalizeAndDedupeSkills(skills: any) {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  const tools = new Set<string>();
  
  const seen = new Set<string>();

  const processCategory = (items: any[], originalCat: "languages" | "frameworks" | "tools") => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (typeof item !== "string") continue;
      const trimmed = item.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);

      // Find authoritative category
      let matchedKey = "";
      let foundCategory: "languages" | "frameworks" | "tools" | null = null;
      for (const [key, cat] of Object.entries(SKILL_CATEGORIES)) {
        if (key.toLowerCase() === lower) {
          matchedKey = key;
          foundCategory = cat;
          break;
        }
      }

      if (foundCategory) {
        if (foundCategory === "languages") languages.add(matchedKey);
        else if (foundCategory === "frameworks") frameworks.add(matchedKey);
        else tools.add(matchedKey);
      } else {
        // Unrecognized skill, preserve original category
        if (originalCat === "languages") languages.add(trimmed);
        else if (originalCat === "frameworks") frameworks.add(trimmed);
        else tools.add(trimmed);
      }
    }
  };

  if (skills) {
    processCategory(skills.languages || [], "languages");
    processCategory(skills.frameworks || [], "frameworks");
    processCategory(skills.tools || [], "tools");
  }

  return {
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    tools: Array.from(tools),
  };
}

export function formatLinkedIn(urlOrHandle: string): string {
  if (!urlOrHandle) return "";
  let clean = urlOrHandle
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, "")
    .replace(/\/+$/, "");
  return `linkedin.com/in/${clean}`;
}

export function formatGitHub(urlOrHandle: string): string {
  if (!urlOrHandle) return "";
  let clean = urlOrHandle
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .replace(/\/+$/, "");
  return `github.com/${clean}`;
}
