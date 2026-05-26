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

    // Provide high-quality example fallback text for first load instead of blank CV preview
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
              github: dbUser.githubUsername ? `github.com/${dbUser.githubUsername}` : (dbUser.name ? `github.com/${dbUser.name.replace(/\s+/g, '')}` : ""),
              linkedin: dbUser.linkedinUrl || "",
              phone: "",
              location: ""
            },
            summary: "Software engineer focused on building high-impact technical solutions. Demonstrated expertise in building modular tools and systems.",
            experience: [
              {
                company: "Tech Solutions Inc. (Example)",
                title: dbUser.targetRole || "Software Engineer",
                period: "2024 - Present",
                bullets: [
                  "Led a high-performing agile engineering team to design and deploy scalable backend applications, reducing query latency by 35%.",
                  "Engineered resilient automated service pipelines and database schemas, maintaining 99.99% system availability under heavy workload profiles.",
                  "Optimized codebases and refactored core components into clean architectural divisions, reducing overall load bounds and enhancing developer experience."
                ]
              },
              {
                company: "Innovative Tech Labs (Example)",
                title: "Software Developer",
                period: "2022 - 2024",
                bullets: [
                  "Collaborated with product designers to build and deploy high-performance user-facing modules and responsive views.",
                  "Designed and executed standard end-to-end and unit testing processes, boosting baseline code coverage metrics by 25%."
                ]
              }
            ],
            education: [
              {
                degree: "Bachelor of Science in Computer Science (Example)",
                school: "State University of Technology",
                year: "2018 - 2022",
                gpa: "3.85",
                gpaType: "gpa"
              }
            ],
            achievements: [
              "Recipient of the Engineering Excellence Award for outstanding contribution to platform scalability and structural optimization.",
              "Awarded First Place at the national Developer Innovation Hackathon for creating high-performance collaborative workspace solutions."
            ],
            skills: {
              languages: ["TypeScript", "JavaScript", "Python", "SQL"],
              frameworks: ["React", "Next.js", "Node.js", "Express.js", "Tailwind CSS"],
              tools: ["Git", "Docker", "AWS", "PostgreSQL", "MongoDB", "Redis"]
            },
            projects: [
              {
                id: "example-project-1",
                title: "E-Commerce Microservices Platform (Example)",
                techStack: ["TypeScript", "NestJS", "RabbitMQ", "Redis", "Docker"],
                description: "High-throughput microservices architecture built to process real-time catalog search and cart management.",
                highlights: [
                  "Designed distributed messaging structures using NestJS and RabbitMQ, scaling parallel request throughput by 40%.",
                  "Integrated Redis caching mechanisms, dropping database lookup latency to sub-10ms ranges."
                ],
                included: true
              }
            ]
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
