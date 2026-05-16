import { prisma } from "./server/prisma";
import { fetchUserRepos, fetchRepoReadme, GithubRepo } from "./github";
import { generateBatchBullets } from "./aiService";

export interface SuggestionScoring {
  stars: number;
  recentActivity: boolean; // updated in last 30 days
  descriptionQuality: boolean; // length > 50
  commitVolume?: number; // we might need more API calls for this, or use repo size as proxy
}

function isRealSkill(skill: string, repoName: string): boolean {
  if (!skill) return false;
  const low = skill.toLowerCase().trim();
  const repoLow = repoName.toLowerCase();
  
  // Exclude if it's EXACTLY the repo name
  if (low === repoLow) return false;
  
  // Generic words to exclude
  const junkWords = ["unknown", "apis", "api", "website", "app", "bot", "requests", "loss", "features", "dashboard", "system", "ytmp3", "ytmpy"];
  if (junkWords.includes(low)) return false;
  
  // AI loves to append "API" to things (e.g. Slack API, WhatsApp API)
  if (low.includes("api") && !["rest api", "graphql", "rest apis", "fetch api"].includes(low)) return false;
  
  // Exclude machine learning concepts that aren't skills (like "CTC loss")
  if (low.includes("loss") || low.includes("accuracy") || low.includes("metric")) return false;
  
  return true;
}

export async function runSmartSync(userId: string, accessToken: string, email?: string) {
  // 1. Fetch User with new relations
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      githubData: true, 
      suggestions: true,
      resumes: {
        include: {
          versions: {
            where: { isMain: true },
            take: 1
          }
        }
      }
    }
  });

  // SELF-HEALING: If not found by ID but we have email, try email
  if (!user && email) {
    user = await prisma.user.findUnique({
      where: { email },
      include: { 
        githubData: true, 
        suggestions: true,
        resumes: {
          include: { versions: { where: { isMain: true }, take: 1 } }
        }
      }
    });
  }

  if (!user) throw new Error("User not found");

  // 2. Cooldown Check (6 hours)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  if (user.githubData?.lastSyncedAt && user.githubData.lastSyncedAt > sixHoursAgo) {
    if (process.env.NODE_ENV !== "development") {
      console.log("Sync cooldown active. Skipping...");
      return { skipped: true, reason: "COOLDOWN_ACTIVE" };
    } else {
      console.log("Dev mode: bypassing cooldown");
    }
  }

  // Get current projects and skills from the Main resume
  let mainResume = user.resumes[0];
  
  // INITIALIZATION: If no resume exists, create the first one
  if (!mainResume) {
    mainResume = await prisma.resume.create({
      data: {
        userId: user.id,
        name: "Master Resume",
        versions: {
          create: {
            versionName: "v1",
            isMain: true,
            personalInfo: {}, // Use objects, not strings for Json fields
            summary: "Aspiring software engineer with a focus on high-impact projects and technical excellence.",
            skills: { languages: [], frameworks: [], tools: [] },
            experience: [],
            projects: [],
            education: []
          }
        }
      },
      include: {
        versions: { where: { isMain: true }, take: 1 }
      }
    });
  }

  const mainVersion = mainResume.versions[0];
  
  // Safely parse projects if they were stored as strings
  let currentProjects: any[] = [];
  if (Array.isArray(mainVersion?.projects)) {
    currentProjects = mainVersion.projects;
  } else if (typeof mainVersion?.projects === 'string') {
    try {
      currentProjects = JSON.parse(mainVersion.projects);
    } catch (e) {
      currentProjects = [];
    }
  }

  // Safely parse skills
  let currentSkills: any = { languages: [], frameworks: [], tools: [] };
  if (typeof mainVersion?.skills === 'object' && mainVersion?.skills !== null && !Array.isArray(mainVersion.skills)) {
    currentSkills = mainVersion.skills;
  } else if (typeof mainVersion?.skills === 'string') {
    try {
      currentSkills = JSON.parse(mainVersion.skills);
    } catch (e) {
      currentSkills = { languages: [], frameworks: [], tools: [] };
    }
  }

  const allCurrentSkills = [
    ...(currentSkills.languages || []),
    ...(currentSkills.frameworks || []),
    ...(currentSkills.tools || [])
  ].map(s => s.toLowerCase());

  // CLEAR STALE SUGGESTIONS
  await prisma.suggestion.deleteMany({
    where: { userId: user.id, status: "PENDING" }
  });

  // 3. Fetch and Score Repos
  const repos = await fetchUserRepos(accessToken);
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const scoredRepos = repos.map(repo => {
    const updatedDate = new Date(repo.updated_at);
    const score = 
      (repo.stargazers_count * 2) + 
      (updatedDate > oneYearAgo ? 10 : 0) + 
      ((repo.description?.length || 0) > 20 ? 5 : 0);
    
    return { ...repo, score };
  });

  const meaningfulRepos = scoredRepos.filter(r => r.score > 0);

  // 4. Compare with DB
  const suggestionsToCreate: any[] = [];
  
  // Fetch GitHub username from the first repo's owner info (available if repos contain it)
  // We'll extract it from the githubData or session — fall back to 'user' placeholder
  let githubUsername: string = "";
  try {
    const ghData = user.githubData;
    // The stored repos may have owner info; try to parse the first one
    const storedRepos: any[] = Array.isArray(ghData?.repositories)
      ? ghData!.repositories
      : typeof ghData?.repositories === "string"
      ? JSON.parse(ghData!.repositories as any)
      : [];
    githubUsername = storedRepos[0]?.owner?.login || "";
  } catch { /* ignore */ }

  for (const repo of meaningfulRepos) {
    // Only skip if there is a PENDING suggestion already
    const existingPending = user.suggestions.find((s: any) => 
      s.status === "PENDING" && s.title.toLowerCase().includes(repo.name.toLowerCase())
    );
    if (existingPending) continue;

    const existingProject = currentProjects.find(p => 
      p.repoUrl?.toLowerCase().includes(repo.name.toLowerCase()) || 
      p.name?.toLowerCase() === repo.name.toLowerCase() ||
      p.title?.toLowerCase() === repo.name.toLowerCase()
    );

    // Build a human-readable description using repo description (README fetched later per-chunk)
    const repoDesc = repo.description
      ? `${repo.name}: ${repo.description}`
      : `${repo.name} (${repo.language || "multi-language"} project, ${repo.stargazers_count} stars)`;

    if (!existingProject) {
      suggestionsToCreate.push({
        type: "NEW_PROJECT",
        title: `New Project: ${repo.name}`,
        description: repoDesc,
        proposedData: repo,
        priority: 3,
        confidence: 0.9,
        _ownerLogin: githubUsername, // internal, stripped before saving
      });
    } else {
      const updatedRecently = new Date(repo.updated_at) > new Date(mainVersion?.updatedAt || 0);
      if (updatedRecently) {
        suggestionsToCreate.push({
          type: "IMPROVE_PROJECT",
          entityId: existingProject.id,
          title: `Update ${repo.name}`,
          description: repoDesc,
          proposedData: repo,
          currentData: { name: existingProject.title, bullets: existingProject.highlights },
          priority: 2,
          confidence: 0.85,
          _ownerLogin: githubUsername,
        });
      }
    }
  }

  // 5. Batch Process Top 30 with AI in chunks
  const topSuggestions = suggestionsToCreate
    .sort((a, b) => b.priority - a.priority || b.confidence - a.confidence)
    .slice(0, 30);
  
  const skillsFoundInThisScan = new Set<string>();

  const chunkSize = 5;
  for (let i = 0; i < topSuggestions.length; i += chunkSize) {
    const chunk = topSuggestions.slice(i, i + chunkSize);
    
    await Promise.all(chunk.map(async (suggestion) => {
      const repo = suggestion.proposedData as any;
      const ownerLogin = suggestion._ownerLogin || "";
      
      try {
        // Fetch README to enrich AI context (best-effort, non-blocking)
        let readme = "";
        if (ownerLogin && repo.name) {
          readme = await fetchRepoReadme(accessToken, ownerLogin, repo.name);
        }

        const aiResult = await generateBatchBullets([{
          name: repo.name,
          description: repo.description || "",
          language: repo.language || "Software Engineering",
          readme, // ← inject README
          topics: repo.topics || [],
          stars: repo.stargazers_count || 0,
        }]);

        const projectData = aiResult.projects[0];

        // Skill Filter
        const filteredSkills = {
          languages: aiResult.skills.languages.filter((l: string) => 
            !allCurrentSkills.includes(l.toLowerCase()) && 
            !skillsFoundInThisScan.has(l.toLowerCase()) &&
            l.length > 1 &&
            isRealSkill(l, repo.name)
          ),
          frameworks: aiResult.skills.frameworks.filter((f: string) => 
            !allCurrentSkills.includes(f.toLowerCase()) && 
            !skillsFoundInThisScan.has(f.toLowerCase()) &&
            f.length > 2 &&
            isRealSkill(f, repo.name)
          ),
          tools: aiResult.skills.tools.filter((t: string) => 
            !allCurrentSkills.includes(t.toLowerCase()) && 
            !skillsFoundInThisScan.has(t.toLowerCase()) &&
            !["Git", "GitHub", "Programming", "Software"].includes(t) &&
            isRealSkill(t, repo.name)
          )
        };

        // Add found skills to the tracker
        Object.values(filteredSkills).flat().forEach(s => skillsFoundInThisScan.add(s.toLowerCase()));

        const skillSummary = Object.values(filteredSkills).flat().slice(0, 3).join(", ");
        if (skillSummary.length > 0) {
          await prisma.suggestion.create({
            data: {
              userId: user!.id,
              type: "ADD_SKILL",
              title: `${skillSummary}${Object.values(filteredSkills).flat().length > 3 ? "..." : ""}`,
              description: `Detected new capabilities from ${repo.name}: ${Object.values(filteredSkills).flat().join(", ")}`,
              proposedData: JSON.stringify(filteredSkills),
              priority: 1,
              confidence: 0.75,
              status: "PENDING"
            }
          });
        }

        await prisma.suggestion.create({
          data: {
            userId: user!.id,
            type: suggestion.type,
            entityId: suggestion.entityId,
            title: suggestion.title,
            // Use AI-generated description if available, fall back to repo description
            description: projectData?.description || suggestion.description,
            proposedData: JSON.stringify(projectData),
            currentData: suggestion.currentData ? JSON.stringify(suggestion.currentData) : null,
            priority: suggestion.priority,
            confidence: Math.min(0.95, (repo.score / 30) + 0.5),
            status: "PENDING"
          }
        });

      } catch (e) {
        console.error("AI batch failed for", repo.name, e);
      }
    }));
  }

  // 6. Update GitHub Data and Sync Time
  // Store full repo objects including owner info for future README fetching
  await prisma.gitHubData.upsert({
    where: { userId: user.id },
    update: { 
      repositories: repos.slice(0, 50) as any, // Prisma Json field
      lastSyncedAt: new Date() 
    },
    create: {
      userId: user.id,
      repositories: repos.slice(0, 50) as any,
      lastSyncedAt: new Date()
    }
  });


  return { success: true, count: topSuggestions.length };
}
