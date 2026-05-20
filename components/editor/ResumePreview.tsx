"use client";

import { CVData, CVExperience, CVEducation, CVSkills, ProjectData } from "@/lib/types";
import { normalizeAndDedupeSkills, formatLinkedIn, formatGitHub } from "@/lib/skills-data";

interface ResumePreviewProps {
  data: CVData;
  projects?: ProjectData[];
  template?: "minimal" | "formal";
  mode?: "non-specialized" | "specialized";
}

export function ResumePreview({
  data,
  projects = [],
  template = "formal",
  mode = "non-specialized",
}: ResumePreviewProps) {
  if (template === "minimal") {
    return <MinimalTemplate data={data} projects={projects} />;
  }
  return <FormalTemplate data={data} projects={projects} mode={mode} />;
}

function FormalTemplate({
  data,
  projects,
  mode,
}: {
  data: CVData;
  projects: ProjectData[];
  mode: "non-specialized" | "specialized";
}) {
  const displaySkills = normalizeAndDedupeSkills(data.skills);

  // Parse summary if it was accidentally stored as JSON
  let displaySummary = "";
  if (typeof data.summary === "string") {
    displaySummary = data.summary;
  } else if (data.summary && typeof data.summary === "object") {
    displaySummary = (data.summary as any).summary || (data.summary as any).Summary || JSON.stringify(data.summary);
  }

  if (displaySummary && typeof displaySummary === "string" && displaySummary.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(displaySummary);
      displaySummary =
        parsed.summary || parsed.Summary || (Object.values(parsed)[0] as string);
    } catch {
      /* ignore */
    }
  }

  // Filter out placeholder bullets from experience
  const cleanExperience = data.experience.slice(0, 3).map((exp) => ({
    ...exp,
    bullets: (exp.bullets || [])
      .filter(
        (b) =>
          b.trim() &&
          b !== "Achieved X by implementing Y resulting in Z% growth."
      )
      .slice(0, 3),
  }));

  // Only show included projects, max 3, max 2 highlights each
  const includedProjects = projects
    .filter((p) => p.included !== false)
    .slice(0, 3)
    .map((p) => ({
      ...p,
      highlights: (p.highlights || []).filter((h) => h.trim()).slice(0, 2),
    }));

  // Content density score: more content = tighter spacing
  const totalBullets =
    cleanExperience.reduce((s, e) => s + e.bullets.length, 0) +
    includedProjects.reduce((s, p) => s + p.highlights.length, 0);
  const dense = totalBullets > 7 || cleanExperience.length + includedProjects.length > 4;

  const secTitle = dense ? "text-[9.5pt]" : "text-[10.5pt]";
  const bodyText = dense ? "text-[8.5pt]" : "text-[9.5pt]";
  const secGap = dense ? "mb-1.5" : "mb-2.5";
  const itemGap = dense ? "space-y-1.5" : "space-y-2.5";

  return (
    <div
      className="bg-white text-black w-[210mm] h-[297mm] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
      id="printable-resume"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        padding: "8mm 10mm",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ── */}
      <header style={{ textAlign: "center", marginBottom: "5px" }}>
        <div
          style={{
            fontSize: "22pt",
            fontWeight: "bold",
            color: "#1a202c",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {data.name || "Your Name"}
        </div>
        <div
          style={{
            fontSize: "8pt",
            color: "#4a5568",
            marginTop: "3px",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0 8px",
            lineHeight: 1.4,
          }}
        >
          {data.location && <span>{data.location}</span>}
          {data.email && <span>• {data.email}</span>}
          {data.phone && <span>• {data.phone}</span>}
          {data.github && (
            <span>
              • {formatGitHub(data.github)}
            </span>
          )}
          {data.linkedin && (
            <span>
              • {formatLinkedIn(data.linkedin)}
            </span>
          )}
        </div>
      </header>

      {/* ── Section renderer helper ── */}
      {/* Professional Summary */}
      <Section title={mode === "specialized" ? "Technical Summary" : "Professional Summary"}>
        <p style={{ fontSize: "9pt", lineHeight: 1.4, color: "#2d3748" }}>
          {displaySummary ||
            "Software engineer building impactful products. Experienced in modern web and cloud technologies."}
        </p>
      </Section>

      {/* Expert-Level Skills */}
      <Section title={mode === "specialized" ? "Technical Skills" : "Expert-Level Skills"}>
        <div style={{ fontSize: "8.5pt", lineHeight: 1.5 }}>
          {(displaySkills.languages || []).length > 0 && (
            <div>
              <b>Languages:</b> {displaySkills.languages.join(", ")}
            </div>
          )}
          {(displaySkills.frameworks || []).length > 0 && (
            <div>
              <b>Frameworks:</b> {displaySkills.frameworks.join(", ")}
            </div>
          )}
          {(displaySkills.tools || []).length > 0 && (
            <div>
              <b>Tools &amp; Cloud:</b> {displaySkills.tools.join(", ")}
            </div>
          )}
        </div>
      </Section>

      {/* Professional Experience */}
      {cleanExperience.length > 0 && (
        <Section title="Professional Experience">
          <div style={{ display: "flex", flexDirection: "column", gap: dense ? "7px" : "10px" }}>
            {cleanExperience.map((exp, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: "9.5pt", fontWeight: "bold" }}>
                    {exp.title}
                  </span>
                  <span style={{ fontSize: "8.5pt", fontWeight: "bold", whiteSpace: "nowrap", marginLeft: "8px" }}>
                    {exp.period}
                  </span>
                </div>
                <div style={{ fontSize: "9pt", color: "#4a5568", marginBottom: "2px" }}>
                  {exp.company}
                </div>
                {exp.bullets.length > 0 && (
                  <ul
                    style={{
                      margin: "2px 0 0 14px",
                      padding: 0,
                      listStyleType: "disc",
                    }}
                  >
                    {exp.bullets.map((bullet, bIdx) => (
                      <li
                        key={bIdx}
                        style={{
                          fontSize: "8.5pt",
                          lineHeight: 1.45,
                          color: "#2d3748",
                          marginBottom: "1px",
                          wordBreak: "break-word",
                        }}
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Technical Projects */}
      {includedProjects.length > 0 && (
        <Section title="Technical Projects">
          <div style={{ display: "flex", flexDirection: "column", gap: dense ? "7px" : "10px" }}>
            {includedProjects.map((project, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: "9.5pt", fontWeight: "bold" }}>
                    {project.title || "Untitled Project"}
                  </span>
                  <span
                    style={{
                      fontSize: "8pt",
                      fontStyle: "italic",
                      color: "#4a5568",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                    }}
                  >
                    {Array.isArray(project.techStack)
                      ? project.techStack.slice(0, 4).join(", ")
                      : typeof project.techStack === "string"
                      ? project.techStack
                      : ""}
                  </span>
                </div>
                {project.description && (
                  <div
                    style={{
                      fontSize: "8.5pt",
                      color: "#2d3748",
                      marginBottom: "2.5px",
                      marginTop: "1.5px",
                    }}
                  >
                    {project.description}
                  </div>
                )}
                {project.highlights.length > 0 && (
                  <ul
                    style={{
                      margin: "2px 0 0 14px",
                      padding: 0,
                      listStyleType: "disc",
                    }}
                  >
                    {project.highlights.map((bullet, bIdx) => (
                      <li
                        key={bIdx}
                        style={{
                          fontSize: "8.5pt",
                          lineHeight: 1.45,
                          color: "#2d3748",
                          marginBottom: "1px",
                          wordBreak: "break-word",
                        }}
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <Section title="Education">
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {data.education.map((edu, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: "9.5pt", fontWeight: "bold" }}>
                    {edu.degree}
                  </span>
                  <span style={{ fontSize: "8.5pt", fontWeight: "bold" }}>
                    {edu.current 
                      ? (edu.year && edu.year.toLowerCase().includes("expected")
                        ? edu.year
                        : `Expected ${edu.year || "Present"}`)
                      : edu.year}
                  </span>
                </div>
                <div style={{ fontSize: "8.5pt", color: "#4a5568" }}>
                  {edu.school}
                  {edu.gpa && (
                    ` • ${
                      (edu as any).gpaType === "percentage"
                        ? `Percentage: ${edu.gpa}${edu.gpa.includes('%') ? '' : '%'}`
                        : (edu as any).gpaType === "cgpa"
                          ? `CGPA: ${edu.gpa}`
                          : `GPA: ${edu.gpa}`
                    }`
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Achievements */}
      {data.achievements &&
        data.achievements.some((a) => a.trim()) && (
          <Section title="Achievements &amp; Certifications">
            <ul style={{ margin: "0 0 0 14px", padding: 0, listStyleType: "disc" }}>
              {data.achievements
                .filter((a) => a.trim())
                .map((ach, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: "8.5pt",
                      lineHeight: 1.45,
                      color: "#2d3748",
                      marginBottom: "1px",
                    }}
                  >
                    {ach}
                  </li>
                ))}
            </ul>
          </Section>
        )}
    </div>
  );
}

/** Reusable section with a bold ruled header */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "7px" }}>
      <div
        style={{
          fontSize: "9.5pt",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          borderTop: "1.5px solid #1a202c",
          paddingTop: "3px",
          marginBottom: "4px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function MinimalTemplate({
  data,
  projects,
}: {
  data: CVData;
  projects: ProjectData[];
}) {
  return (
    <div
      className="bg-white text-black p-12 w-[210mm] min-h-[297mm] shadow-[0_0_50px_rgba(0,0,0,0.5)] font-sans"
      id="printable-resume"
    >
      <header className="border-b-2 border-black pb-4 mb-8 text-center">
        <h1 className="text-4xl font-bold uppercase tracking-tight mb-2">
          {data.name}
        </h1>
        <div className="flex justify-center gap-4 text-sm font-medium">
          <span>{data.email}</span>
          <span>•</span>
          <span>{data.github}</span>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-bold border-b border-black mb-4 pb-1 uppercase tracking-wider">
          Experience
        </h2>
        <div className="space-y-6">
          {data.experience.map((exp, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-lg font-bold">{exp.title}</h3>
                <span className="text-sm font-semibold italic text-neutral-600">
                  {exp.period}
                </span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {(exp.bullets || []).map((bullet, bIdx) => (
                  <li
                    key={bIdx}
                    className="text-[11pt] leading-relaxed text-gray-800"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold border-b border-black mb-4 pb-1 uppercase tracking-wider">
          Skills
        </h2>
        <div className="text-[11pt] leading-relaxed">
          <p>
            <span className="font-bold">Technical:</span>{" "}
            {(data.skills?.languages || []).join(", ")},{" "}
            {(data.skills?.frameworks || []).join(", ")}
          </p>
        </div>
      </section>
    </div>
  );
}
