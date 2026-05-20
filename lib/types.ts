// lib/types.ts — Shared CV data types used across client and server

export interface CVSkills {
  languages: string[];
  frameworks: string[];
  tools: string[];
}

export interface CVExperience {
  company: string;
  title: string;
  period: string;
  bullets: string[];
}

export interface CVEducation {
  school: string;
  degree: string;
  year: string;
  gpa?: string;
  gpaType?: "gpa" | "cgpa" | "percentage";
  current?: boolean;
}

export interface CVData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  summary: string;
  targetRole: string;
  skills: CVSkills;
  experience: CVExperience[];
  education: CVEducation[];
  achievements?: string[];
  atsScore?: number;
  slug?: string;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl?: string | null;
  githubUrl?: string | null;
  highlights: string[];
  aiGenerated?: boolean;
  included?: boolean; // UI-only
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type EditorTab = "profile" | "skills" | "experience" | "projects" | "education";
