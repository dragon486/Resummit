import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import type { CVData, ProjectData } from "@/lib/types";
import { normalizeAndDedupeSkills, formatLinkedIn, formatGitHub } from "@/lib/skills-data";

// Standard Times-Roman styles matching the FormalTemplate in ResumePreview.tsx perfectly
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    fontFamily: "Times-Roman",
    backgroundColor: "#ffffff",
    fontSize: 9,
    color: "#2d3748",
    paddingHorizontal: 35,
    paddingVertical: 30,
  },
  // ── Header ──
  header: {
    textAlign: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    marginBottom: 3,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    fontSize: 8,
    color: "#4a5568",
  },
  contactText: {
    fontSize: 8,
    fontFamily: "Times-Roman",
    color: "#4a5568",
  },
  contactSep: {
    fontSize: 8,
    color: "#4a5568",
    marginHorizontal: 4,
  },
  // ── Section Container ──
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#1a202c",
    borderTopWidth: 1.5,
    borderTopColor: "#1a202c",
    paddingTop: 3,
    marginBottom: 4,
  },
  // ── Professional Summary ──
  summaryText: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    lineHeight: 1.4,
    color: "#2d3748",
  },
  // ── Skills ──
  skillsContainer: {
    fontSize: 8.5,
    lineHeight: 1.5,
  },
  skillLine: {
    flexDirection: "row",
    marginBottom: 1,
  },
  skillLabel: {
    fontFamily: "Times-Bold",
    color: "#1a202c",
    marginRight: 4,
  },
  skillText: {
    fontFamily: "Times-Roman",
    color: "#2d3748",
  },
  // ── Generic Entry Row (Experience, Projects, Education) ──
  entry: {
    marginBottom: 6,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  entryTitleLeft: {
    fontSize: 9.5,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    flex: 1,
  },
  entryTimeRight: {
    fontSize: 8.5,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    textAlign: "right",
    marginLeft: 10,
  },
  entryTimeRightItalic: {
    fontSize: 8,
    fontFamily: "Times-Italic",
    color: "#4a5568",
    textAlign: "right",
    marginLeft: 10,
  },
  entrySubtitle: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#4a5568",
    marginBottom: 2,
  },
  entryDescriptionItalic: {
    fontSize: 8.5,
    fontFamily: "Times-Roman",
    color: "#2d3748",
    marginBottom: 2.5,
  },
  // ── Bullet Lists ──
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 12,
  },
  bulletDot: {
    width: 3,
    height: 3,
    backgroundColor: "#2d3748",
    borderRadius: 1.5,
    marginRight: 6,
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: "Times-Roman",
    lineHeight: 1.4,
    color: "#2d3748",
  },
});

// Render bullets using simple bullet design matching standard HTML list styling
const BulletList = ({ bullets }: { bullets: string[] }) => (
  <View>
    {bullets.map((b, i) => (
      <View key={i} style={styles.bulletRow}>
        <View style={styles.bulletDot} />
        <Text style={styles.bulletText}>{b}</Text>
      </View>
    ))}
  </View>
);

export const CVDocument = ({ cv, projects }: { cv: CVData; projects: ProjectData[] }) => {
  // Gracefully parse and normalize skills properties
  const rawSkills = typeof cv.skills === "string" ? JSON.parse(cv.skills as any) : cv.skills;
  const skills = normalizeAndDedupeSkills(rawSkills);
  const experience = typeof cv.experience === "string" ? JSON.parse(cv.experience as any) : cv.experience;
  const education = typeof cv.education === "string" ? JSON.parse(cv.education as any) : cv.education;

  // Sync filtration logic with ResumePreview (only included, max 3 projects)
  const includedProjects = (projects || [])
    .filter((p) => p.included !== false)
    .slice(0, 3)
    .map((p) => ({
      ...p,
      highlights: (p.highlights || []).filter((h) => h.trim()).slice(0, 2),
    }));

  const cleanExperience = (experience || []).slice(0, 3).map((exp: any) => ({
    ...exp,
    bullets: (exp.bullets || [])
      .filter((b: string) => b.trim() && b !== "Achieved X by implementing Y resulting in Z% growth.")
      .slice(0, 3),
  }));

  // Render centered contact parts
  const contactParts: string[] = [];
  if (cv.location) contactParts.push(cv.location);
  if (cv.email) contactParts.push(cv.email);
  if (cv.phone) contactParts.push(cv.phone);
  if (cv.github) {
    contactParts.push(formatGitHub(cv.github));
  }
  if (cv.linkedin) {
    contactParts.push(formatLinkedIn(cv.linkedin));
  }

  // Parse summary display
  let displaySummary = "";
  if (typeof cv.summary === "string") {
    displaySummary = cv.summary;
  } else if (cv.summary && typeof cv.summary === "object") {
    displaySummary = (cv.summary as any).summary || (cv.summary as any).Summary || JSON.stringify(cv.summary);
  }

  if (displaySummary && typeof displaySummary === "string" && displaySummary.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(displaySummary);
      displaySummary = parsed.summary || parsed.Summary || (Object.values(parsed)[0] as string);
    } catch { /* ignore */ }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Centered Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{cv.name || "Your Name"}</Text>
          <View style={styles.contactRow}>
            {contactParts.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text style={styles.contactSep}>•</Text>}
                <Text style={styles.contactText}>{part}</Text>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Professional Summary */}
        {displaySummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{cv.targetRole ? "Technical Summary" : "Professional Summary"}</Text>
            <Text style={styles.summaryText}>{displaySummary}</Text>
          </View>
        )}

        {/* Technical Skills */}
        {((skills.languages || []).length > 0 || (skills.frameworks || []).length > 0 || (skills.tools || []).length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            <View style={styles.skillsContainer}>
              {(skills.languages || []).length > 0 && (
                <View style={styles.skillLine}>
                  <Text style={styles.skillLabel}>Languages:</Text>
                  <Text style={styles.skillText}>{skills.languages.join(", ")}</Text>
                </View>
              )}
              {(skills.frameworks || []).length > 0 && (
                <View style={styles.skillLine}>
                  <Text style={styles.skillLabel}>Frameworks:</Text>
                  <Text style={styles.skillText}>{skills.frameworks.join(", ")}</Text>
                </View>
              )}
              {(skills.tools || []).length > 0 && (
                <View style={styles.skillLine}>
                  <Text style={styles.skillLabel}>Tools &amp; Cloud:</Text>
                  <Text style={styles.skillText}>{skills.tools.join(", ")}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Professional Experience */}
        {cleanExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {cleanExperience.map((exp: any, idx: number) => (
              <View key={idx} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitleLeft}>{exp.title}</Text>
                  <Text style={styles.entryTimeRight}>{exp.period}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{exp.company}</Text>
                {exp.bullets?.length > 0 && <BulletList bullets={exp.bullets} />}
              </View>
            ))}
          </View>
        )}

        {/* Technical Projects */}
        {includedProjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Projects</Text>
            {includedProjects.map((project: any, idx: number) => {
              const techStr = Array.isArray(project.techStack)
                ? project.techStack.slice(0, 4).join(", ")
                : typeof project.techStack === "string"
                ? project.techStack
                : "";

              return (
                <View key={idx} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitleLeft}>{project.title || "Untitled Project"}</Text>
                    {techStr ? <Text style={styles.entryTimeRightItalic}>{techStr}</Text> : null}
                  </View>
                  {project.description && (
                    <Text style={styles.entryDescriptionItalic}>{project.description}</Text>
                  )}
                  {project.highlights?.length > 0 && <BulletList bullets={project.highlights} />}
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu: any, idx: number) => (
              <View key={idx} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitleLeft}>{edu.degree}</Text>
                  <Text style={styles.entryTimeRight}>{edu.year}</Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {edu.school}{edu.gpa ? ` • GPA: ${edu.gpa}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Achievements & Certifications */}
        {cv.achievements && cv.achievements.some((a: string) => a.trim()) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements &amp; Certifications</Text>
            <BulletList bullets={cv.achievements.filter((a: string) => a.trim())} />
          </View>
        )}

      </Page>
    </Document>
  );
};
