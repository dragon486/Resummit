// lib/aiService.ts
import 'server-only'

import fs from 'fs'
import path from 'path'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const GEMINI_MODEL = 'gemini-2.0-flash' // gemini-1.5-flash deprecated from v1beta API

type AIMode = 'gemini' | 'ollama'

function getGeminiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (err) {
    console.error('[AI] Dynamic .env read error:', err);
  }
  return undefined;
}

function getAIMode(): AIMode {
  const key = getGeminiKey()
  if (key && key.length > 10) return 'gemini'
  return 'ollama'
}

async function callGemini(prompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const key = getGeminiKey()
  const genAI = new GoogleGenerativeAI(key!)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' }
  })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3, num_predict: 2048 }
    }),
    signal: AbortSignal.timeout(60000)
  })
  if (!response.ok) throw new Error(`Ollama error: ${response.status}`)
  const data = await response.json()
  return data.response
}

export async function callAI(prompt: string): Promise<string> {
  const mode = getAIMode()
  
  if (mode === 'gemini') {
    try {
      return await callGemini(prompt)
    } catch (error: any) {
      // If quota hit (429), try Ollama as emergency fallback
      if (error.message?.includes('429') || 
          error.message?.includes('quota') ||
          error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn('[AI] Gemini quota hit — falling back to Ollama')
        try {
          return await callOllama(prompt)
        } catch (ollamaError) {
          // Ollama not running in prod — throw clear error
          throw new Error('AI_QUOTA_EXCEEDED')
        }
      }
      throw error
    }
  }
  
  // Dev mode: Ollama only
  return await callOllama(prompt)
}

export function safeParseJSON(raw: string): any {
  const cleaned = raw
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in response')
  return JSON.parse(cleaned.slice(start, end + 1))
}

export interface GeneratedCV {
  summary: string
  skills: {
    languages: string[]
    frameworks: string[]
    tools: string[]
  }
  projects: Array<{
    title: string
    techStack: string[]
    highlights: string[]
    description: string
    aiGenerated: boolean
  }>
}

/**
 * Generate comprehensive CV data from repository context.
 * Exported as an alias 'generateBatchBullets' for backward compatibility.
 */
export async function generateCVFromRepos(
  repos: any[],
  targetRole: string = 'Software Engineer'
): Promise<GeneratedCV> {

  const repoSummary = repos.slice(0, 6).map(r => ({
    name: r.name,
    description: r.description || '',
    language: r.language || 'Unknown',
    topics: r.topics || [],
    stars: r.stargazers_count || 0,
    readme: r.readme ? r.readme.slice(0, 800) : '', // include README snippet
  }))

  const prompt = `You are a recruiter-grade resume generator. Your goal is to produce high-signal, authentic resume data for a ${targetRole}.

Analyze these GitHub repositories (including README excerpts where available) and return JSON.
Return ONLY valid JSON. No markdown. No intro. No adjectives.

{
  "summary": "Exactly 2 sentences. 
   Sentence 1: What they built and the domain (e.g., 'Software engineer building ML-based recognition systems.'). 
   Sentence 2: Primary technologies used (e.g., 'Works with Python, TensorFlow, and AWS.').
   DO NOT START WITH: 'I am', 'Experienced', 'Passionate'.",
  "skills": {
    "languages": ["deterministic languages from repo data only"],
    "frameworks": ["libraries/frameworks inferred from descriptions and READMEs"],
    "tools": ["Git, Docker, APIs, etc."]
  },
  "projects": [
    {
      "title": "repo name",
      "techStack": ["LANGUAGE", "FRAMEWORK"],
      "description": "One sentence technical summary based on README content",
      "highlights": [
        "What was built + specific tech used + observable effect (e.g., 'Built a WhatsApp bot using Node.js to automate customer query responses.').",
        "Technical implementation detail + tech used + specific result (e.g., 'Implemented CNN + BiLSTM in Python to decode distorted text with sequence prediction.')."
      ]
    }
  ]
}

STRICT CONSTRAINTS:
- Use README content to write accurate, specific descriptions — not generic statements.
- No buzzwords: leveraged, robust, scalable, utilized, streamlined, spearheaded, cutting-edge.
- No adjectives: passionate, dedicated, dynamic, innovative.
- Impact Forcing: Every bullet MUST include a result or observable effect. If no metric exists, describe the logical benefit (e.g. 'automated tasks').
- Maximum 3 projects. Exactly 2 bullets per project.
- Summary MUST be exactly 2 sentences.
- SKILLS EXTRACTION: ONLY extract globally recognized technologies (e.g. React, Python, PostgreSQL, AWS). Do NOT extract random API names (e.g. Slack API, Meta API), repository names (e.g. ytmp3), random English words, or generic terms (e.g. APIs, unknown, requests).
- description field MUST be a meaningful technical sentence, not "No description provided".

Repositories:
${JSON.stringify(repoSummary, null, 2)}`

  let parsed: any;
  try {
    const raw = await callAI(prompt)
    parsed = safeParseJSON(raw)
  } catch (err) {
    console.warn("[AI] callAI failed inside generateCVFromRepos. Falling back to deterministic resume parsing.", err);
    
    // Deterministic parsing of repo names, languages, and descriptions
    const projectsList = repos.slice(0, 3).map((r, idx) => {
      const language = r.language || "TypeScript";
      const techStack = Array.isArray(r.topics) && r.topics.length > 0 
        ? r.topics.slice(0, 3) 
        : [language, "Node.js", "Git"];
      
      const highlights = [
        `Developed ${r.name} using ${language} to streamline repository functionality and architecture.`,
        r.description 
          ? `Implemented clean code patterns and integrated ${techStack.join(', ')} to enhance user experience.`
          : `Engineered project components and modular architecture to optimize performance and deployment.`
      ];

      return {
        title: r.name || `Engineering Project ${idx + 1}`,
        techStack,
        description: r.description || `High-performance modular project developed using ${language}.`,
        highlights,
        aiGenerated: false
      };
    });

    const allLanguages = Array.from(new Set(repos.map(r => r.language).filter(Boolean))) as string[];
    const allTopics = Array.from(new Set(repos.flatMap(r => r.topics || []).filter(Boolean))) as string[];

    parsed = {
      summary: `High-signal Software Engineer specializing in modern software development and engineering solutions. Demonstrated expertise in building modular tools and systems using ${allLanguages.slice(0, 3).join(', ')}.`,
      skills: {
        languages: allLanguages.length > 0 ? allLanguages.slice(0, 4) : ["TypeScript", "JavaScript", "Python"],
        frameworks: allTopics.filter(t => ["react", "nextjs", "nestjs", "express", "django", "vue"].includes(t.toLowerCase())).slice(0, 4),
        tools: ["Git", "Docker", "REST APIs", "GitHub Actions"]
      },
      projects: projectsList
    };
  }

  // Validate and fill defaults if model misses fields
  return {
    summary: Array.isArray(parsed.summary) 
      ? parsed.summary.join(' ') 
      : (typeof parsed.summary === 'string' 
          ? parsed.summary 
          : 'Software engineer building web applications and tools. Experienced in JavaScript and Python.'),
    skills: {
      languages: parsed.skills?.languages || [],
      frameworks: parsed.skills?.frameworks || [],
      tools: parsed.skills?.tools?.length ? parsed.skills.tools : ['Git'],
    },
    projects: (parsed.projects || []).slice(0, 3).map((p: any) => ({
      title: p.title || p.name || 'Project',
      techStack: Array.isArray(p.techStack) ? p.techStack : [p.tech || 'JavaScript'],
      description: p.description || 'Project built with modern technologies.',
      highlights: (p.highlights || p.bullets || ['Built this project using modern web technologies.']).slice(0, 2),
      aiGenerated: true,
    })),
  }
}

// Backward Compatibility Alias
export const generateBatchBullets = generateCVFromRepos;


export async function regenerateSummary(
  projects: any[],
  skills: any,
  experience: any[],
  targetRole: string,
  profileReadme?: string
): Promise<string> {
  const projectsCtx = projects && projects.length > 0 
    ? projects.map(p => `- ${p.title || p.name}: ${p.description || ""} (Tech: ${Array.isArray(p.tech) ? p.tech.join(', ') : p.tech || ""})`).join('\n')
    : "No projects specified.";

  const skillsCtx = skills 
    ? `Languages: ${(skills.languages || []).join(', ')}\nFrameworks: ${(skills.frameworks || []).join(', ')}\nTools & Cloud: ${(skills.tools || []).join(', ')}`
    : "No skills specified.";

  const expCtx = experience && experience.length > 0
    ? experience.map(e => `- ${e.title} at ${e.company} (${e.period}): ${(e.bullets || []).join('; ')}`).join('\n')
    : "No experience specified.";

  const readmeCtx = profileReadme && profileReadme.trim()
    ? `GitHub Profile Bio/README Info:\n${profileReadme.slice(0, 1000)}`
    : "";

  const prompt = `Write a highly punchy, 2-sentence professional resume summary for a ${targetRole} role, focusing on software engineering depth.

Crucial Rule: Do NOT mention or invent any programming languages, frameworks, or tools that are NOT listed in the Skills Grid or Projects/Experience sections below. This creates a credibility disconnect. Stick strictly to what is verified.

Profile Info:
${readmeCtx}

Active Skills Grid:
${skillsCtx}

Active Experience History:
${expCtx}

Active Projects Portfolio:
${projectsCtx}

Rules:
- Sentence 1: A highly punchy technical description of the systems, engineering domains, or product architectures they specialize in and build (tailored to a ${targetRole} role).
- Sentence 2: Direct, non-generic list of primary technologies they deploy, chosen STRICTLY from the verified active skills/projects (e.g. 'Builds distributed web architectures using Next.js, FastAPI, and PostgreSQL').
- No adjectives (passionate, motivated, expert, seasoned) or generic filler sentences.
- No buzzwords.
- RETURN ONLY THE RAW SUMMARY TEXT! DO NOT WRAP IN JSON! NO BRACKETS! NO KEYS! ONLY TEXT!
`;

  const raw = await callAI(prompt)
  
  let cleaned = raw.replace(/^"|"$/g, '').trim();
  if (cleaned.startsWith('{')) {
    try {
      const parsed = JSON.parse(cleaned);
      cleaned = parsed.summary || parsed.Summary || Object.values(parsed)[0];
    } catch {
       // fallback if JSON parse fails
    }
  }
  
  return cleaned;
}

export async function regenerateBullet(
  bullet: string,
  projectName: string,
  tech: string,
  targetRole: string
): Promise<string> {
  const prompt = `Rewrite this resume bullet to be stronger for a ${targetRole} role.

Project: ${projectName} (${Array.isArray(tech) ? tech.join(', ') : tech})
Original bullet: ${bullet}

Rules:
- Start with a strong past tense action verb
- Under 18 words
- Include the specific technology
- No buzzwords
- Return only the bullet text, nothing else`

  const raw = await callAI(prompt)
  return raw.replace(/^"|"$/g, '').trim()
}

export interface StrengthScore {
  score: number
  breakdown: {
    skills: number
    projects: number
    impact: number
    overall: number
  }
  weakSignals: string[]
  topIssues: string[]
  quickFixes: string[]
}

export async function calculateATSScore(
  cvText: string,
  targetRole: string
): Promise<StrengthScore> {
  const prompt = `Score this resume for a ${targetRole} role.
  
Return ONLY valid JSON:
{
  "score": <integer 0-100>,
  "breakdown": {
    "skills": <integer 0-100 based on density of ${targetRole} terms>,
    "projects": <integer 0-100 based on technical depth>,
    "impact": <integer 0-100 based on presence of outcomes/results>
  },
  "weakSignals": ["list flags from: SHORT_SUMMARY, REPETITIVE_VERBS, LOW_SKILL_DENSITY, NO_IMPACT_BULLETS"],
  "topIssues": ["issue 1", "issue 2"],
  "quickFixes": ["fix 1", "fix 2"]
}

Rules for Weak Signals:
- SHORT_SUMMARY: if summary text is under 80 characters.
- REPETITIVE_VERBS: if the same action verb starts more than 2 bullets.
- LOW_SKILL_DENSITY: if fewer than 6 technical skills are listed.
- NO_IMPACT_BULLETS: if zero bullets state an outcome or effect.

Resume:
${cvText.slice(0, 3000)}`

  const raw = await callAI(prompt)
  
  try {
    const parsed = safeParseJSON(raw)
    return {
      score: Math.min(100, Math.max(0, parseInt(parsed.score as any) || 50)),
      breakdown: {
        skills: parsed.breakdown?.skills || 50,
        projects: parsed.breakdown?.projects || 50,
        impact: parsed.breakdown?.impact || 50,
        overall: Math.min(100, Math.max(0, parseInt(parsed.score as any) || 50))
      },
      weakSignals: parsed.weakSignals || [],
      topIssues: parsed.topIssues || [],
      quickFixes: parsed.quickFixes || [],
    }
  } catch {
    return { 
      score: 50, 
      breakdown: { skills: 50, projects: 50, impact: 50, overall: 50 },
      weakSignals: ['SCAN_FAILED'],
      topIssues: ['Could not analyze'], 
      quickFixes: [] 
    }
  }
}

export async function suggestSkills(projects: any[], existing: any[]): Promise<any> {
  const prompt = `Based on these projects: ${JSON.stringify(projects)}, suggest additional technical skills to add to a resume. 
Do NOT repeat these existing skills: ${JSON.stringify(existing)}.
Return JSON only:
{
  "languages": ["lang1"],
  "frameworks": ["framework1"],
  "tools": ["tool1"]
}
If no new skills can be inferred, return empty arrays.`;

  const raw = await callAI(prompt);
  try {
    return safeParseJSON(raw);
  } catch {
    return { languages: [], frameworks: [], tools: [] };
  }
}

/**
 * AI-powered skill extraction from rich GitHub repo context.
 * Takes actual repo metadata (language, topics, README snippets) to extract
 * skills with much higher accuracy than project titles alone.
 */
export async function suggestSkillsFromGitHub(
  repos: Array<{ name: string; language: string | null; description: string | null; topics: string[]; readme: string }>,
  projects: any[],
  existing: string[]
): Promise<{ languages: string[]; frameworks: string[]; tools: string[] }> {
  if (repos.length === 0 && projects.length === 0) {
    return { languages: [], frameworks: [], tools: [] };
  }

  const repoSummaries = repos.map(r => {
    const parts = [];
    if (r.name) parts.push(`Repo: ${r.name}`);
    if (r.language) parts.push(`Language: ${r.language}`);
    if (r.topics?.length) parts.push(`Topics: ${r.topics.join(", ")}`);
    if (r.description) parts.push(`Description: ${r.description}`);
    if (r.readme) parts.push(`README excerpt: ${r.readme.slice(0, 400)}`);
    return parts.join(" | ");
  }).join("\n");

  const prompt = `You are a technical resume AI. Analyze the following GitHub repositories and extract the specific technical skills this engineer has demonstrated.

GITHUB REPOSITORIES:
${repoSummaries}

RESUME PROJECTS (additional context):
${projects.slice(0, 5).map((p: any) => `${p.title || p.name}: ${(p.techStack || []).join(", ")}`).join("\n")}

ALREADY LISTED SKILLS (do NOT include these):
${existing.join(", ") || "none"}

RULES:
- Only include skills clearly evidenced by the code/repos above
- Classify each skill as: languages (programming languages), frameworks (libraries/frameworks), or tools (databases, cloud, devops, etc.)
- Use proper formal names: "Node.js" not "nodejs", "PostgreSQL" not "postgres"
- Minimum 3 per category if evidence exists
- Do NOT hallucinate skills not mentioned in the repos

Return ONLY valid JSON, no explanation:
{
  "languages": [],
  "frameworks": [],
  "tools": []
}`;

  const raw = await callAI(prompt);
  try {
    const parsed = safeParseJSON(raw);
    return {
      languages: Array.isArray(parsed.languages) ? parsed.languages.filter((s: any) => typeof s === "string" && s.length > 0) : [],
      frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks.filter((s: any) => typeof s === "string" && s.length > 0) : [],
      tools: Array.isArray(parsed.tools) ? parsed.tools.filter((s: any) => typeof s === "string" && s.length > 0) : [],
    };
  } catch {
    return { languages: [], frameworks: [], tools: [] };
  }
}
