const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(modulePath) {
  if (modulePath === 'server-only') return {};
  return originalRequire.apply(this, arguments);
};

const dotenv = require('dotenv');
dotenv.config();

const { prisma } = require('./lib/server/db.js');

const SKILL_MAP = {
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

const SKILL_CATEGORIES = {
  "JavaScript": "languages", "TypeScript": "languages", "Python": "languages",
  "Java": "languages", "C++": "languages", "C": "languages", "Go": "languages",
  "Kotlin": "languages", "Swift": "languages", "Dart": "languages",
  "Ruby": "languages", "PHP": "languages", "Scala": "languages",
  "HTML/CSS": "languages", "Shell": "languages", "Bash": "languages",
  "Rust": "languages", "C#": "languages", "SQL": "languages", "R": "languages",
  "Perl": "languages", "Haskell": "languages", "Solidity": "languages",
  "Objective-C": "languages", "MATLAB": "languages", "Jupyter Notebook": "languages",
  "PowerShell": "languages", "Assembly": "languages",

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

function textContainsKeyword(text, keyword) {
  if (/[^a-zA-Z0-9]/.test(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|\\s|[.,;()![\\]{}"'])` + escaped + `(?:$|\\s|[.,;()![\\]{}"'])`, "i");
    return re.test(text);
  } else {
    const re = new RegExp(`\\b${keyword}\\b`, "i");
    return re.test(text);
  }
}

function extractDeterministicSkills(repos) {
  const skillFrequency = {};

  for (const repo of repos) {
    const seenInThisRepo = new Set();

    if (repo.language) {
      const mapped = SKILL_MAP[repo.language.toLowerCase()];
      if (mapped && !seenInThisRepo.has(mapped)) {
        skillFrequency[mapped] = (skillFrequency[mapped] || 0) + 2;
        seenInThisRepo.add(mapped);
      }
    }

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

  const qualifiedSkills = Object.entries(skillFrequency)
    .filter(([, freq]) => freq >= 1)
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill);

  const result = {
    languages: [],
    frameworks: [],
    tools: [],
  };

  for (const skill of qualifiedSkills) {
    const cat = SKILL_CATEGORIES[skill] || "tools";
    if (result[cat].length < 12) {
      result[cat].push(skill);
    }
  }

  return result;
}

async function test() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        githubData: {
          accessToken: { not: null }
        }
      },
      include: { githubData: true }
    });

    if (!user) {
      console.log('No user found');
      return;
    }

    const repos = user.githubData?.repositories || [];
    console.log(`Analyzing ${repos.length} repos...`);
    const skills = extractDeterministicSkills(repos);
    console.log('Discovered skills:', JSON.stringify(skills, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
