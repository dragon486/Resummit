import { auth } from "@/auth";
import { prisma, resolveUserId } from "@/lib/server/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const session = await auth();
  const userId = await resolveUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id } = body;
    
    const suggestion = await prisma.suggestion.findUnique({
      where: { id, userId }
    });

    if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });

    // In V1, we apply suggestions to the "Main" resume version
    const mainVersion = await prisma.resumeVersion.findFirst({
      where: { 
        resume: { userId },
        isMain: true 
      }
    });

    if (!mainVersion) return NextResponse.json({ error: "Main resume version not found" }, { status: 400 });

    const proposed = typeof suggestion.proposedData === 'string' ? JSON.parse(suggestion.proposedData) : suggestion.proposedData;
    
    let currentProjects: any[] = [];
    if (Array.isArray(mainVersion.projects)) {
      currentProjects = mainVersion.projects;
    } else if (typeof mainVersion.projects === 'string') {
      try {
        const parsed = JSON.parse(mainVersion.projects);
        if (Array.isArray(parsed)) currentProjects = parsed;
      } catch {}
    }

    let updatedProjects = [...currentProjects];

    const projectToAdd = {
      id: Math.random().toString(36).slice(2, 11),
      title: (proposed.title || proposed.name || suggestion.title || "New Project").replace("New Project: ", ""),
      techStack: Array.isArray(proposed.techStack) ? proposed.techStack : (proposed.tech ? [proposed.tech] : []),
      highlights: Array.isArray(proposed.highlights) ? proposed.highlights : (proposed.bullets ? proposed.bullets : []),
      description: proposed.description || suggestion.description || "",
      githubUrl: proposed.repoUrl || suggestion.entityId || null,
      aiGenerated: true,
      included: true
    };

    // If highlights is empty but description exists, use description as a bullet
    if (projectToAdd.highlights.length === 0 && projectToAdd.description) {
      projectToAdd.highlights = [projectToAdd.description];
    }

    if (suggestion.type === "NEW_PROJECT") {
      const exists = updatedProjects.some(p => p.title.toLowerCase() === projectToAdd.title.toLowerCase());
      if (!exists) {
        updatedProjects.unshift(projectToAdd);
      }
    } else if (suggestion.type === "IMPROVE_PROJECT" && suggestion.entityId) {
      updatedProjects = currentProjects.map((p: any) => 
        p.id === suggestion.entityId 
          ? { ...p, ...projectToAdd, id: p.id }
          : p
      );
    } else if (suggestion.type === "ADD_SKILL") {
      let currentSkills = { languages: [], frameworks: [], tools: [] };
      if (typeof mainVersion.skills === 'object' && mainVersion.skills !== null && !Array.isArray(mainVersion.skills)) {
        currentSkills = mainVersion.skills as any;
      } else if (typeof mainVersion.skills === 'string') {
        try {
          const parsed = JSON.parse(mainVersion.skills);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            currentSkills = parsed;
          }
        } catch {}
      }

      const newSkills = proposed;
      
      const merge = (current: string[], proposed: string[]) => {
        const combined = [...(current || [])];
        const lowerCurrent = combined.map(s => s.toLowerCase());
        
        for (const s of (proposed || [])) {
          if (!lowerCurrent.includes(s.toLowerCase())) {
            combined.push(s);
            lowerCurrent.push(s.toLowerCase());
          }
        }
        return combined;
      };

      const mergedSkills = {
        languages: merge(currentSkills.languages, newSkills.languages),
        frameworks: merge(currentSkills.frameworks, newSkills.frameworks),
        tools: merge(currentSkills.tools, newSkills.tools),
      };

      await prisma.resumeVersion.update({
        where: { id: mainVersion.id },
        data: { 
          skills: mergedSkills,
          projects: currentProjects as any // Keep projects same
        }
      });
      
      revalidatePath('/editor');
      await prisma.suggestion.update({ where: { id }, data: { status: "APPLIED" } });
      return NextResponse.json({ success: true, skills: mergedSkills });
    }


    await prisma.resumeVersion.update({
      where: { id: mainVersion.id },
      data: { projects: updatedProjects as any }
    });

    revalidatePath('/editor');

    // Mark as applied
    await prisma.suggestion.update({
      where: { id },
      data: { status: "APPLIED" }
    });


    return NextResponse.json({ success: true, project: projectToAdd });
  } catch (error: any) {
    console.error("[SUGGESTIONS] Approval error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
