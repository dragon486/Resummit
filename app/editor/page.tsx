import "server-only";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";
import { EditorClient } from "./EditorClient";

export const metadata: Metadata = {
  title: "Resummit OS Editor — Premium Developer Resume Suite",
  description: "Craft, tailor, and refine your software engineer resume with the Resummit OS Editor by Adel Muhammed. Real engineering work, single-page hard limit safeguards, and real-time ATS optimization.",
};

export default async function EditorPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // SELF-HEALING: Verify the user ID exists in the DB (in case of provider ID vs CUID mismatch)
  let dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!dbUser && session.user.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
  }

  if (!dbUser) {
    // If we still can't find the user, their session is completely invalid
    redirect("/api/auth/signout");
  }

  const userId = dbUser.id; // Use the verified database ID

  // Fetch or create Resume container
  let resume = await prisma.resume.findFirst({
    where: { userId: userId },
    include: {
      versions: {
        where: { isMain: true },
        take: 1
      }
    }
  });

  if (!resume) {
    // Check if we have GitHub data to pre-populate
    const githubData = await prisma.gitHubData.findUnique({
      where: { userId: userId }
    });

    resume = await prisma.resume.create({
      data: {
        userId: userId,
        name: "My Professional Resume",
        versions: {
          create: {
            versionName: "Main",
            isMain: true,
            personalInfo: {
              name: dbUser.name || "",
              email: dbUser.email || "",
              github: dbUser.name ? `github.com/${dbUser.name.replace(/\s+/g, '')}` : "",
              linkedin: "",
              phone: "",
              location: ""
            },
            summary: "Software engineer focused on building high-impact technical solutions.",
            // If they have github data, we could pre-sync here, but for now just empty
            projects: [],
          }
        }
      },
      include: {
        versions: {
          where: { isMain: true },
          take: 1
        }
      }
    });
  }

  const mainVersion = resume.versions[0];
  if (!mainVersion) {
    redirect("/dashboard");
  }

  // Fetch signals
  let githubData = await prisma.gitHubData.findUnique({
    where: { userId: userId }
  });

  let signals = githubData?.signals as any || null;

  // Self-healing: Generate signals if missing but repos exist
  if (!signals && githubData && Array.isArray(githubData.repositories) && githubData.repositories.length > 0) {
    const { generateEngineeringSignals } = await import("@/lib/server/githubIntelligence");
    signals = await generateEngineeringSignals(githubData.repositories as any[], "General Software Engineer");
    await prisma.gitHubData.update({
      where: { id: githubData.id },
      data: { signals: signals as any }
    });
  }

  // Fetch suggestions
  const suggestions = await prisma.suggestion.findMany({
    where: { 
      userId: userId,
      status: "PENDING"
    },
    orderBy: { priority: "desc" }
  });

  const accessToken = (session as any)?.accessToken;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-neutral-950">
      <EditorClient 
        resumeId={resume.id}
        versionId={mainVersion.id}
        initialData={mainVersion} 
        signals={signals}
        accessToken={accessToken}
        initialSuggestions={suggestions as any[]}
      />
    </div>
  );
}
