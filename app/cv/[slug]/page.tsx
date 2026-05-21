import { prisma } from "@/lib/server/prisma";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cv = await prisma.cV.findUnique({ where: { slug: slug } });
  if (!cv) {
    return {
      title: "Resume Not Found | Resummit",
      description: "The requested professional developer resume could not be found on Resummit.",
    };
  }
  return {
    title: `${cv.name} — Professional Developer Resume | Resummit`,
    description: `View ${cv.name}'s verified technical resume. Built from real engineering work and GitHub repositories via Resummit AI — developed by Adel Muhammed.`,
  };
}

export default async function PublicCVPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cv = await prisma.cV.findUnique({ where: { slug: slug } });
  
  if (!cv) {
    notFound();
  }

  const projects = await prisma.project.findMany({
    where: { userId: cv.userId },
    orderBy: { createdAt: "desc" },
  });

  const skills = typeof cv.skills === "string" ? JSON.parse(cv.skills) : cv.skills;
  const experience = typeof cv.experience === "string" ? JSON.parse(cv.experience) : cv.experience;
  const education = typeof cv.education === "string" ? JSON.parse(cv.education) : cv.education;

  return (
    <div className="min-h-screen bg-neutral-100 py-12 px-4 flex flex-col items-center">
      {/* Download Action */}
      <div className="max-w-[794px] w-full flex justify-end mb-4">
        {/* We would wire this up with a client component to trigger the fetch export, but for simplicity here we assume standard print behavior or an API ping */}
        <a 
          href="javascript:window.print()"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </a>
      </div>

      {/* CV Document Wrapper */}
      <div className="bg-white shadow-xl max-w-[794px] w-full mx-auto p-12 text-neutral-900 font-sans print:shadow-none print:p-0">
        
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-[0.2em] uppercase mb-2 font-serif">{cv.name}</h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-neutral-600">
            {cv.email && <span>{cv.email}</span>}
            {cv.github && <span>• {cv.github}</span>}
            {cv.linkedin && <span>• {cv.linkedin}</span>}
            {cv.location && <span>• {cv.location}</span>}
          </div>
        </header>

        {/* Summary */}
        {cv.summary && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-neutral-800 pb-1 mb-3">Summary</h2>
            <p className="text-sm leading-relaxed">{cv.summary}</p>
          </section>
        )}

        {/* Skills */}
        {(skills?.languages?.length > 0 || skills?.frameworks?.length > 0 || skills?.tools?.length > 0) && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-neutral-800 pb-1 mb-3">Skills</h2>
            <div className="text-sm leading-relaxed space-y-1">
              {skills.languages?.length > 0 && (
                <div><span className="font-bold w-24 inline-block">Languages:</span> {skills.languages.join(", ")}</div>
              )}
              {skills.frameworks?.length > 0 && (
                <div><span className="font-bold w-24 inline-block">Frameworks:</span> {skills.frameworks.join(", ")}</div>
              )}
              {skills.tools?.length > 0 && (
                <div><span className="font-bold w-24 inline-block">Tools:</span> {skills.tools.join(", ")}</div>
              )}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-neutral-800 pb-1 mb-3">Technical Projects</h2>
            <div className="space-y-4">
              {projects.map((p: any) => {
                const bullets = typeof p.bullets === "string" ? JSON.parse(p.bullets) : p.bullets;
                return (
                  <div key={p.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-sm">{p.name}</h3>
                      <span className="text-sm italic text-neutral-600">{p.techStack}</span>
                    </div>
                    <ul className="list-disc list-outside ml-4 space-y-1">
                      {bullets.map((b: string, i: number) => (
                        <li key={i} className="text-sm leading-relaxed pl-1">{b}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-neutral-800 pb-1 mb-3">Experience</h2>
            <div className="space-y-4">
              {experience.map((exp: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-sm">{exp.company}</h3>
                    <span className="text-sm text-neutral-600">{exp.period}</span>
                  </div>
                  <div className="text-sm italic mb-1">{exp.title}</div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 space-y-1">
                      {exp.bullets.map((b: string, idx: number) => (
                        <li key={idx} className="text-sm leading-relaxed pl-1">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-neutral-800 pb-1 mb-3">Education</h2>
            <div className="space-y-3">
              {education.map((edu: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-sm">{edu.school}</h3>
                    <span className="text-sm text-neutral-600">{edu.year}</span>
                  </div>
                  <div className="text-sm">
                    {edu.degree} {edu.gpa && <span className="text-neutral-500">• GPA: {edu.gpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="mt-12 text-center text-xs text-neutral-500 print:hidden flex flex-col items-center gap-1.5">
        <div>Built with <span className="font-bold text-neutral-700">Resummit AI</span></div>
        <div className="text-[10px] text-neutral-400">Created by <a href="https://github.com/dragon486" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 hover:underline transition-colors">Adel Muhammed</a></div>
      </footer>
    </div>
  );
}
