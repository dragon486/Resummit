"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Download, Plus, Trash2, RotateCcw, Link as LinkIcon, CheckCircle2, Activity, Eye, Sparkles, Target, X, Loader2, User, Briefcase, Code2, GraduationCap, Zap, AlertTriangle, ChevronDown, ChevronUp, Save, Wifi, WifiOff, ArrowUp, ArrowDown, ExternalLink, Rocket, Cpu, Code, Terminal, GitBranch, Lock } from "lucide-react";
import type { CVData, ProjectData, CVSkills, CVExperience, CVEducation, SaveStatus, EditorTab } from "@/lib/types";
import { ResumePreview } from "@/components/editor/ResumePreview";
import { normalizeAndDedupeSkills } from "@/lib/skills-data";

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function InlineEdit({
  value,
  onChange,
  placeholder,
  className = "",
  multiline = false,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
}) {
  if (multiline) {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full bg-neutral-900/40 border border-white/5 rounded-xl px-4 py-3 text-[13px] text-neutral-200 placeholder:text-neutral-700 outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none leading-relaxed font-medium ${className}`}
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-neutral-900/40 border border-white/5 rounded-xl px-4 py-2.5 text-[13px] text-neutral-200 placeholder:text-neutral-700 outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium ${className}`}
    />
  );
}

function SkillTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-neutral-800/80 border border-white/10 text-neutral-300 px-3 py-1.5 rounded-full text-[11px] font-semibold group hover:border-blue-500/30 transition-all cursor-default">
      {label}
      <button
        onClick={onRemove}
        className="text-neutral-600 hover:text-red-400 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-neutral-600 mb-1.5 ml-0.5">
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────
// Experience Date Picker Component
// ─────────────────────────────────────────────

function ExperienceDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 25 }, (_, idx) => (currentYear - idx).toString());

  // Parse current value
  const parsePeriod = (periodStr: string) => {
    const defaultVal = {
      startMonth: "Jan",
      startYear: currentYear.toString(),
      endMonth: "Dec",
      endYear: currentYear.toString(),
      isPresent: true,
    };

    if (!periodStr) return defaultVal;

    const parts = periodStr.split(/[–-]/).map((s) => s.trim());
    if (parts.length === 0) return defaultVal;

    const parsePart = (part: string) => {
      if (!part) return { month: "Jan", year: currentYear.toString(), isPresent: false };
      if (part.toLowerCase().includes("present")) {
        return { month: "Present", year: "", isPresent: true };
      }
      const words = part.split(/\s+/).filter(Boolean);
      
      let m = "Jan";
      if (words.length > 0) {
        const wordLower = words[0].toLowerCase();
        const found = MONTHS.find(mon => mon.toLowerCase().startsWith(wordLower.slice(0, 3)));
        if (found) m = found;
        else m = words[0];
      }

      if (words.length >= 2) {
        return { month: m, year: words[1], isPresent: false };
      } else if (words.length === 1) {
        const y = parseInt(words[0]);
        if (!isNaN(y) && y > 1900 && y < 2100) {
          return { month: "Jan", year: words[0], isPresent: false };
        } else {
          return { month: m, year: currentYear.toString(), isPresent: false };
        }
      }
      return { month: "Jan", year: currentYear.toString(), isPresent: false };
    };

    const start = parsePart(parts[0]);
    const end = parts.length > 1 ? parsePart(parts[1]) : { month: "Present", year: "", isPresent: true };

    return {
      startMonth: start.month,
      startYear: start.year,
      endMonth: end.isPresent ? "Present" : end.month,
      endYear: end.isPresent ? currentYear.toString() : end.year,
      isPresent: end.isPresent || periodStr.toLowerCase().includes("present"),
    };
  };

  const { startMonth, startYear, endMonth, endYear, isPresent } = parsePeriod(value);

  const update = (updates: {
    startMonth?: string;
    startYear?: string;
    endMonth?: string;
    endYear?: string;
    isPresent?: boolean;
  }) => {
    const sM = updates.startMonth !== undefined ? updates.startMonth : startMonth;
    const sY = updates.startYear !== undefined ? updates.startYear : startYear;
    const pres = updates.isPresent !== undefined ? updates.isPresent : isPresent;
    const eM = updates.endMonth !== undefined ? updates.endMonth : endMonth;
    const eY = updates.endYear !== undefined ? updates.endYear : endYear;

    if (pres) {
      onChange(`${sM} ${sY} – Present`);
    } else {
      onChange(`${sM} ${sY} – ${eM} ${eY}`);
    }
  };

  return (
    <div className="space-y-2 bg-neutral-950/40 border border-white/5 rounded-xl p-2.5">
      {/* Start Date Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 w-10 shrink-0">Start</span>
        <div className="grid grid-cols-2 gap-1.5 flex-1 min-w-0">
          <select
            value={startMonth}
            onChange={(e) => update({ startMonth: e.target.value })}
            className="w-full bg-neutral-900/40 border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-neutral-200 outline-none focus:border-blue-500/40 transition-all font-semibold cursor-pointer text-center"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m} className="bg-neutral-950 text-neutral-200">{m}</option>
            ))}
          </select>
          <select
            value={startYear}
            onChange={(e) => update({ startYear: e.target.value })}
            className="w-full bg-neutral-900/40 border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-neutral-200 outline-none focus:border-blue-500/40 transition-all font-semibold cursor-pointer text-center"
          >
            {YEARS.map((y) => (
              <option key={y} value={y} className="bg-neutral-950 text-neutral-200">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Currently Work Here Checkbox */}
      <div className="flex items-center gap-2 pl-12 py-0.5">
        <input
          type="checkbox"
          id={`present-checkbox-${value}`}
          checked={isPresent}
          onChange={(e) => update({ isPresent: e.target.checked })}
          className="rounded border-white/10 bg-neutral-900/40 text-blue-500 focus:ring-blue-500/30 w-3.5 h-3.5 cursor-pointer accent-blue-500"
        />
        <label
          htmlFor={`present-checkbox-${value}`}
          className="text-[10px] font-bold text-neutral-500 select-none cursor-pointer hover:text-neutral-300 transition-colors"
        >
          Currently work here (Present)
        </label>
      </div>

      {/* End Date Row */}
      {!isPresent && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 w-10 shrink-0">End</span>
          <div className="grid grid-cols-2 gap-1.5 flex-1 min-w-0">
            <select
              value={endMonth === "Present" ? "Dec" : endMonth}
              onChange={(e) => update({ endMonth: e.target.value })}
              className="w-full bg-neutral-900/40 border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-neutral-200 outline-none focus:border-blue-500/40 transition-all font-semibold cursor-pointer text-center"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m} className="bg-neutral-950 text-neutral-200">{m}</option>
              ))}
            </select>
            <select
              value={endYear}
              onChange={(e) => update({ endYear: e.target.value })}
              className="w-full bg-neutral-900/40 border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-neutral-200 outline-none focus:border-blue-500/40 transition-all font-semibold cursor-pointer text-center"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-neutral-950 text-neutral-200">{y}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ATS Score Panel
// ─────────────────────────────────────────────

function ATSPanel({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-white/10 p-12 rounded-[2.5rem] w-full max-w-2xl relative shadow-2xl overflow-hidden ring-1 ring-white/5">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-600/10 blur-[100px] rounded-full" />
        
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-colors p-2.5 hover:bg-white/5 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative">
          <div className="flex flex-col items-center mb-12">
            <div className="text-[11px] font-black uppercase tracking-[6px] text-blue-500 mb-6 bg-blue-500/10 px-4 py-1.5 rounded-full">
              Intelligence Audit
            </div>
            <div
              className={`text-[120px] leading-none font-black tracking-tighter font-outfit drop-shadow-[0_10px_40px_rgba(37,99,235,0.2)] ${
                data.score >= 70 ? "text-white" : data.score >= 50 ? "text-yellow-400" : "text-red-400"
              }`}
            >
              {data.score}
            </div>
            <div className="h-2 w-72 bg-white/5 rounded-full overflow-hidden mt-8 shadow-inner">
              <div
                className={`h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] ${
                  data.score >= 70 ? "bg-blue-500" : data.score >= 50 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${data.score}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {Object.entries(data.breakdown || {})
              .filter(([k]) => k !== "overall")
              .map(([key, val]) => (
                <div
                  key={key}
                  className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col items-center group hover:bg-blue-500/5 transition-colors"
                >
                  <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-2 group-hover:text-blue-400">
                    {key}
                  </div>
                  <div className="text-2xl font-bold text-white font-outfit">{val as number}%</div>
                </div>
              ))}
          </div>

          {data.topIssues?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2 ml-1">
                Critical Improvements
              </p>
              {data.topIssues.map((issue: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm text-neutral-300 bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 hover:border-blue-500/20 transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                  {issue}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CV Preview (Right Panel)
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// Main EditorClient
// ─────────────────────────────────────────────

function ensureArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

import { SmartUpdateCenter } from "@/components/dashboard/SmartUpdateCenter";

export function EditorClient({
  resumeId,
  versionId,
  initialData,
  signals,
  accessToken,
  initialSuggestions = []
}: {
  resumeId: string;
  versionId: string;
  initialData: any; 
  signals: any;
  accessToken?: string;
  initialSuggestions?: any[];
}) {
  const [mode, setMode] = useState<"non-specialized" | "specialized">("non-specialized");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // Map ResumeVersion fields to local state
  const [personalInfo, setPersonalInfo] = useState<any>(
    typeof initialData.personalInfo === 'string' 
      ? JSON.parse(initialData.personalInfo) 
      : (initialData.personalInfo || {})
  );
  const [summary, setSummary] = useState<string>(initialData.summary || "");
  
  const [skills, setSkills] = useState<CVSkills>(() => {
    const s = initialData.skills;
    if (typeof s === 'string') {
      try { return JSON.parse(s); } catch { }
    }
    return s || { languages: [], frameworks: [], tools: [] };
  });

  const [experience, setExperience] = useState<CVExperience[]>(() => ensureArray(initialData.experience));
  const [projects, setProjects] = useState<ProjectData[]>(() => ensureArray(initialData.projects));
  const [education, setEducation] = useState<CVEducation[]>(() => ensureArray(initialData.education));
  const [achievements, setAchievements] = useState<string[]>(() => ensureArray(initialData.achievements || [""]));
  
  // LIVE PROJECTS SYNC: Remove redundant fetch on mount as initialData is already version-specific
  // and fetching from /api/projects would corrupt specialized versions with 'Main' data.


  const [activeTab, setActiveTab] = useState<EditorTab>("profile");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [atsData, setAtsData] = useState<any>(null);
  const [atsError, setAtsError] = useState<string | null>(null);
  const [atsPanelOpen, setAtsPanelOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Derived CV object for preview and PDF
  const cv: CVData = {
    name: personalInfo.name || "",
    email: personalInfo.email || "",
    phone: personalInfo.phone || "",
    location: personalInfo.location || "",
    github: personalInfo.github || "",
    linkedin: personalInfo.linkedin || "",
    summary,
    targetRole: personalInfo.targetRole || "Software Engineer",
    skills,
    experience,
    education,
    achievements,
    atsScore: initialData.atsScore,
  };

  // AI action states
  const [regeneratingSummary, setRegeneratingSummary] = useState(false);
  const [suggestingSkills, setSuggestingSkills] = useState(false);
  const [rewritingBullet, setRewritingBullet] = useState<string | null>(null); // "projIdx-bulletIdx"

  // Expanded card tracking
  const [expandedProject, setExpandedProject] = useState<number | null>(0);
  const [expandedExperience, setExpandedExperience] = useState<number | null>(0);

  const [isSyncing, setIsSyncing] = useState(false);
  const [generatingExpBullets, setGeneratingExpBullets] = useState<number | null>(null);
  const [generatingProjectFromReadme, setGeneratingProjectFromReadme] = useState<number | null>(null);
  const [expContext, setExpContext] = useState<Record<number, string>>({});
  const [cvWarnings, setCvWarnings] = useState<string[]>([]); // CV quality warnings from save API
  const [skillValidation, setSkillValidation] = useState<{
    verified: string[];
    unverified: string[];
    suggested: { languages: string[]; frameworks: string[]; tools: string[] };
  } | null>(null);
  const [validatingSkills, setValidatingSkills] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

  // ── Auto-save (debounced 2s) ──
  const saveCV = useCallback(async () => {
    if (isSyncing) return; // DON'T save if we are currently syncing from GitHub
    setSaveStatus("saving");
    try {
      // Authoritatively normalize categories and cross-deduplicate skills before saving
      const dedupeSkills = (s: any) => normalizeAndDedupeSkills(s);

      // Auto-fix duplicate words in experience titles before saving
      const cleanedExperience = experience.map(exp => ({
        ...exp,
        title: (exp.title || "").replace(/\b(\w+)\s+\1\b/gi, "$1").trim(),
      }));

      const res = await fetch("/api/cv/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          versionId, 
          data: {
            personalInfo,
            summary,
            skills: dedupeSkills(skills),
            experience: cleanedExperience,
            projects,
            education,
            atsScore: atsData?.score || 0
          }
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      // Surface any CV quality warnings
      if (saved.warnings && saved.warnings.length > 0) {
        setCvWarnings(saved.warnings);
        setTimeout(() => setCvWarnings([]), 8000); // auto-dismiss after 8s
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    }
  }, [versionId, personalInfo, summary, skills, experience, projects, education, atsData, isSyncing]);



  useEffect(() => {
    // Skip the very first run on mount to prevent immediate save of unchanged data
    if (!isDirty.current) {
      isDirty.current = true;
      return;
    }

    if (isSyncing) return; // PAUSE auto-save during sync
    
    setSaveStatus("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    
    // Set timer for 2 seconds
    saveTimer.current = setTimeout(() => {
      saveCV();
    }, 2000);

    return () => { 
      if (saveTimer.current) clearTimeout(saveTimer.current); 
    };
  }, [personalInfo, summary, skills, experience, projects, education, isSyncing, saveCV]);

  // ── beforeunload guard: save immediately if dirty on tab close ──
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirty.current) {
        saveCV();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveCV]);

  // ── Load ATS score on mount ──
  useEffect(() => {
    fetch(`/api/cv/ats-score?versionId=${versionId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.error) setAtsError(d.error);
        else setAtsData(d);
      })
      .catch((e) => setAtsError(e.message));
  }, []);

  // Save immediately when switching tabs if there is a pending save
  useEffect(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      saveCV();
    }
  }, [activeTab, saveCV]);

  // ── State update helpers ──
  const updatePersonalInfo = (field: string, val: any) =>
    setPersonalInfo((prev: any) => ({ ...prev, [field]: val }));

  const updateSkills = (type: keyof CVSkills, val: string[]) =>
    setSkills((prev) => ({ ...prev, [type]: val }));

  const addSkill = (type: keyof CVSkills, raw: string) => {
    const val = raw.trim();
    if (!val) return;
    const current = skills[type] || [];
    if (!current.includes(val)) updateSkills(type, [...current, val]);
  };

  const removeSkill = (type: keyof CVSkills, idx: number) => {
    const nu = [...(skills[type] || [])];
    nu.splice(idx, 1);
    updateSkills(type, nu);
  };

  const updateExp = (i: number, field: keyof CVExperience, val: any) => {
    const nu = [...experience];
    (nu[i] as any)[field] = val;
    setExperience(nu);
  };

  const updateExpBullet = (expIdx: number, bulletIdx: number, val: string) => {
    const nu = [...experience];
    nu[expIdx] = { ...nu[expIdx], bullets: [...nu[expIdx].bullets] };
    nu[expIdx].bullets[bulletIdx] = val;
    setExperience(nu);
  };


  const addExpBullet = (expIdx: number) => {
    const nu = [...experience];
    nu[expIdx] = { ...nu[expIdx], bullets: [...nu[expIdx].bullets, ""] };
    setExperience(nu);
  };

  const removeExpBullet = (expIdx: number, bulletIdx: number) => {
    const nu = [...experience];
    nu[expIdx] = {
      ...nu[expIdx],
      bullets: nu[expIdx].bullets.filter((_, i) => i !== bulletIdx),
    };
    setExperience(nu);
  };

  const addExperience = () => {
    setExperience([
      ...experience,
      { company: "", title: "", period: "", bullets: [""] },
    ]);
  };

  const removeExperience = (i: number) => {
    setExperience(experience.filter((_, idx) => idx !== i));
  };

  // ── Education helpers ──
  const updateEdu = (i: number, field: keyof CVEducation, val: any) => {
    const nu = [...education];
    (nu[i] as any)[field] = val;
    setEducation(nu);
  };

  const addEducation = () => {
    setEducation([...education, { school: "", degree: "", year: "", gpa: "", gpaType: "gpa", current: false }]);
  };

  const removeEducation = (i: number) => {
    setEducation(education.filter((_, idx) => idx !== i));
  };

  // ── Project helpers ──
  const updateProject = (i: number, field: keyof ProjectData, val: any) => {
    const nu = [...projects];
    (nu[i] as any)[field] = val;
    setProjects(nu);
  };

  // Fixes a highlight (bullet) at a specific index in a project
  const updateProjectBullet = (pIdx: number, bIdx: number, val: string) => {
    const nu = [...projects];
    const highlights = [...(nu[pIdx].highlights || [])];
    highlights[bIdx] = val;
    nu[pIdx] = { ...nu[pIdx], highlights };
    setProjects(nu);
  };

  const updateProjectHighlight = updateProjectBullet; // alias kept for compatibility

  // ── AI Experience Bullet Generation ──
  const handleGenerateExpBullets = async (i: number) => {
    const exp = experience[i];
    if (!exp.company && !exp.title) return;
    setGeneratingExpBullets(i);
    try {
      const res = await fetch("/api/cv/generate-experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: exp.company,
          title: exp.title,
          period: exp.period,
          context: expContext[i] || "",
        }),
      });
      const d = await res.json();
      if (d.bullets && Array.isArray(d.bullets)) {
        const nu = [...experience];
        // Replace only placeholder bullets, keep user-written ones
        const existingMeaningful = nu[i].bullets.filter(
          b => b.trim() && b !== "Achieved X by implementing Y resulting in Z% growth."
        );
        nu[i] = { ...nu[i], bullets: [...existingMeaningful, ...d.bullets] };
        setExperience(nu);
      }
    } catch {
      /* silent */
    } finally {
      setGeneratingExpBullets(null);
    }
  };

  const handleGenerateProjectFromReadme = async (idx: number) => {
    const p = projects[idx];
    if (!p.title) return;
    setGeneratingProjectFromReadme(idx);
    try {
      const res = await fetch("/api/github/project-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: p.title,
          techStack: p.techStack || [],
        }),
      });
      const d = await res.json();
      if (d.success) {
        const nu = [...projects];
        nu[idx] = {
          ...nu[idx],
          description: d.description,
          highlights: d.highlights || [],
        };
        setProjects(nu);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingProjectFromReadme(null);
    }
  };

  // ── Skill Validation (cross-ref against real repos) ──
  const handleValidateSkills = async () => {
    setValidatingSkills(true);
    setSkillValidation(null); 
    try {
      const res = await fetch("/api/cv/validate-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSkills: skills }),
      });
      const d = await res.json();
      
      if (res.ok) {
        setSkillValidation(d);
      }
    } catch {
      /* silent background failure */
    } finally {
      setValidatingSkills(false);
    }
  };

  const handleRemoveUnverified = () => {
    if (!skillValidation) return;
    const unverifiedLower = new Set(skillValidation.unverified.map(s => s.toLowerCase()));
    setSkills({
      languages: (skills.languages || []).filter(s => !unverifiedLower.has(s.toLowerCase())),
      frameworks: (skills.frameworks || []).filter(s => !unverifiedLower.has(s.toLowerCase())),
      tools: (skills.tools || []).filter(s => !unverifiedLower.has(s.toLowerCase())),
    });
    setSkillValidation(null); // clear results after fix
  };

  // ── AI actions ──
  const handleRegenerateSummary = async () => {
    setRegeneratingSummary(true);
    try {
      const res = await fetch("/api/cv/regenerate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects,
          skills,
          experience,
          targetRole: personalInfo.targetRole,
        }),
      });
      const d = await res.json();
      if (d.summary) setSummary(d.summary);
    } catch {
      /* silent */
    } finally {
      setRegeneratingSummary(false);
    }
  };

  const handleSuggestSkills = async () => {
    setSuggestingSkills(true);
    try {
      const res = await fetch("/api/cv/suggest-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects,
          existing: [
            ...(skills.languages || []),
            ...(skills.frameworks || []),
            ...(skills.tools || []),
          ],
        }),
      });
      const d = await res.json();
      if (d.skills) {
        const s = d.skills;
        // Deduplicate case-insensitively when merging
        const mergeUnique = (existing: string[], incoming: string[]) => {
          const seen = new Set(existing.map(x => x.toLowerCase()));
          const result = [...existing];
          for (const item of incoming) {
            if (item && !seen.has(item.toLowerCase())) {
              result.push(item);
              seen.add(item.toLowerCase());
            }
          }
          return result;
        };
        setSkills({
          languages: mergeUnique(skills.languages || [], s.languages || []),
          frameworks: mergeUnique(skills.frameworks || [], s.frameworks || []),
          tools: mergeUnique(skills.tools || [], s.tools || []),
        });
      }
    } catch {
      /* silent */
    } finally {
      setSuggestingSkills(false);
    }
  };

  const handleRewriteBullet = async (
    pIdx: number,
    bIdx: number,
    current: string
  ) => {
    const key = `${pIdx}-${bIdx}`;
    setRewritingBullet(key);
    try {
      const p = projects[pIdx];
      const res = await fetch("/api/cv/regenerate-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: current,
          projectName: p.title, // was p.name — ProjectData has `title`, not `name`
          tech: p.techStack,
          targetRole: cv.targetRole,
        }),
      });
      const d = await res.json();
      if (d.bullet) updateProjectBullet(pIdx, bIdx, d.bullet);
    } catch {
      /* silent */
    } finally {
      setRewritingBullet(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/cv/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv, projects: projects.filter((p) => p.included !== false) }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(cv.name || "resume").replace(/\s+/g, "_")}_resume.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      alert("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleTailorResume = async () => {
    if (!jdText) return;
    setIsTailoring(true);
    try {
      const res = await fetch("/api/cv/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resumeId, 
          jobDescription: jdText,
          jobTitle 
        }),
      });
      const result = await res.json();
      if (result.success) {
        const d = result.data;
        setPersonalInfo(d.personalInfo);
        setSummary(d.summary);
        setSkills(d.skills);
        setExperience(d.experience);
        setProjects(d.projects);
        setEducation(d.education);
        setActiveTab("profile");
        alert("Resume successfully tailored for " + (jobTitle || "the position") + "!");
      }
    } catch (error) {
      console.error("Tailoring failed", error);
    } finally {
      setIsTailoring(false);
    }
  };

  // ── Save status UI / Global Save Button ──
  const SaveIndicator = () => {
    const hasUnsavedChanges = !!saveTimer.current;
    
    let btnText = "Saved ✓";
    let btnStyle = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 cursor-default";
    let Icon = CheckCircle2;
    
    if (saveStatus === "saving") {
      btnText = "Saving...";
      btnStyle = "text-blue-400 bg-blue-500/10 border border-blue-500/20 cursor-not-allowed";
      Icon = Loader2;
    } else if (saveStatus === "error") {
      btnText = "Sync Error";
      btnStyle = "text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 cursor-pointer animate-pulse";
      Icon = AlertTriangle;
    } else if (hasUnsavedChanges) {
      btnText = "Save changes";
      btnStyle = "text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]";
      Icon = Save;
    } else if (saveStatus === "idle") {
      btnText = "Save Resume";
      btnStyle = "text-neutral-400 bg-neutral-500/10 border border-neutral-500/20 hover:bg-neutral-500/20 cursor-pointer";
      Icon = Save;
    }
    
    const handleManualSave = () => {
      if (saveStatus === "saving") return;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      saveCV();
    };

    return (
      <button
        onClick={handleManualSave}
        disabled={saveStatus === "saving"}
        className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-xl transition-all active:scale-95 ${btnStyle}`}
      >
        {Icon === Loader2 ? <Icon className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        {btnText}
      </button>
    );
  };

  // ── CV quality warnings banner ──
  const CvWarningBanner = () => {
    if (cvWarnings.length === 0) return null;
    return (
      <div className="mx-4 mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">CV Quality Issues Detected</p>
          {cvWarnings.map((w, i) => (
            <p key={i} className="text-[10px] text-amber-300/70">{w}</p>
          ))}
        </div>
        <button onClick={() => setCvWarnings([])} className="ml-auto text-amber-500/50 hover:text-amber-400">
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // Tab: Profile
  // ─────────────────────────────────────────────
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <SectionLabel>Full Name</SectionLabel>
          <InlineEdit value={cv.name} onChange={(v) => updatePersonalInfo("name", v)} placeholder="Full Name" />
        </div>
        <div className="col-span-1">
          <SectionLabel>Target Job Title</SectionLabel>
          <InlineEdit
            value={cv.targetRole}
            onChange={(v) => updatePersonalInfo("targetRole", v)}
            placeholder="e.g. Senior Backend Engineer"
          />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div>
            <SectionLabel>Email Address</SectionLabel>
            <InlineEdit value={cv.email} onChange={(v) => updatePersonalInfo("email", v)} placeholder="professional@email.com" />
          </div>
          <div>
            <SectionLabel>Phone Number</SectionLabel>
            <InlineEdit value={cv.phone} onChange={(v) => updatePersonalInfo("phone", v)} placeholder="+1 (555) 000 000" />
          </div>
        </div>
        <div className="col-span-2">
          <SectionLabel>Location</SectionLabel>
          <InlineEdit value={cv.location} onChange={(v) => updatePersonalInfo("location", v)} placeholder="San Francisco, CA" />
        </div>
        <div className="col-span-1">
          <SectionLabel>GitHub Link</SectionLabel>
          <InlineEdit value={cv.github} onChange={(v) => updatePersonalInfo("github", v)} placeholder="github.com/handle" />
        </div>
        <div className="col-span-1">
          <SectionLabel>LinkedIn Link</SectionLabel>
          <InlineEdit
            value={cv.linkedin}
            onChange={(v) => updatePersonalInfo("linkedin", v)}
            placeholder="linkedin.com/in/handle"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Professional Summary</SectionLabel>
          <button
            onClick={handleRegenerateSummary}
            disabled={regeneratingSummary}
            className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-all bg-blue-500/5 hover:bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/10"
          >
            {regeneratingSummary ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            )}
            {regeneratingSummary ? "Analyzing Content" : "✦ AI Improve"}
          </button>
        </div>
        <InlineEdit
          value={cv.summary}
          onChange={(v) => setSummary(v)}
          placeholder="Two sentences of high-impact technical positioning."
          multiline
          rows={5}
        />
        <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
           <Zap className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" />
           <p className="text-[10px] text-yellow-200/60 leading-relaxed font-medium">Recruiters scan this for 7 seconds. Aim for exactly two high-density sentences.</p>
        </div>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>Education</SectionLabel>
        <button
          onClick={addEducation}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5"
        >
          <Plus className="w-3.5 h-3.5" /> Entry
        </button>
      </div>
      {education.map((edu, i) => (
        <div key={i} className="group relative bg-[#121212] border border-white/5 rounded-2xl p-5 mb-4 hover:border-blue-500/20 transition-all">
          <button
            onClick={() => removeEducation(i)}
            className="absolute top-4 right-4 text-neutral-700 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/5"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <SectionLabel>Institution</SectionLabel>
              <InlineEdit value={edu.school} onChange={(v) => updateEdu(i, "school", v)} placeholder="University Name" />
            </div>
            <div className="col-span-1">
              <SectionLabel>Degree / Certification</SectionLabel>
              <InlineEdit value={edu.degree} onChange={(v) => updateEdu(i, "degree", v)} placeholder="B.Sc. in Engineering" />
            </div>
             <div className="col-span-1">
                <div className="flex items-center justify-between mb-1.5">
                  <SectionLabel>Completion</SectionLabel>
                  <button
                    type="button"
                    onClick={() => updateEdu(i, "current" as any, !edu.current)}
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                      edu.current
                        ? "bg-emerald-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.2)] font-bold"
                        : "bg-neutral-900 text-neutral-500 border border-white/5 hover:text-neutral-300"
                    }`}
                  >
                    Pursuing
                  </button>
                </div>
                <InlineEdit 
                  value={edu.year} 
                  onChange={(v) => updateEdu(i, "year", v)} 
                  placeholder={edu.current ? "Expected 2027" : "2024"} 
                />
             </div>
            <div className="col-span-1">
               <SectionLabel>GPA / Mark Type</SectionLabel>
               <div className="flex bg-[#0a0a0a] border border-white/[0.05] p-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider gap-0.5 select-none w-full mb-1.5 shrink-0">
                 {(["gpa", "cgpa", "percentage"] as const).map((t) => (
                   <button
                     key={t}
                     type="button"
                     onClick={() => updateEdu(i, "gpaType" as any, t)}
                     className={`flex-1 py-1 rounded transition-all cursor-pointer text-center ${
                       (edu.gpaType || "gpa") === t
                         ? "bg-blue-600 text-white font-bold"
                         : "text-neutral-500 hover:text-neutral-300"
                     }`}
                   >
                     {t === "percentage" ? "%" : t.toUpperCase()}
                   </button>
                 ))}
               </div>
               <InlineEdit 
                 value={edu.gpa || ""} 
                 onChange={(v) => updateEdu(i, "gpa", v)} 
                 placeholder={(edu.gpaType || "gpa") === "percentage" ? "75" : (edu.gpaType || "gpa") === "cgpa" ? "9.2" : "4.0"} 
               />
            </div>
          </div>
        </div>
      ))}

      {/* Achievements & Certifications */}
      <div className="pt-8 border-t border-white/5">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Achievements & Certifications</SectionLabel>
          <button
            onClick={() => setAchievements([...achievements, ""])}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5"
          >
            <Plus className="w-3.5 h-3.5" /> Achievement
          </button>
        </div>
        <div className="space-y-3">
          {achievements.map((ach, idx) => (
            <div key={idx} className="flex gap-3 items-start group">
              <div className="mt-4 w-1.5 h-1.5 rounded-full bg-neutral-800 shrink-0 group-hover:bg-blue-500 transition-colors" />
              <div className="flex-1">
                <InlineEdit
                  value={ach}
                  onChange={(v) => {
                    const nu = [...achievements];
                    nu[idx] = v;
                    setAchievements(nu);
                  }}
                  placeholder="e.g. Google Cloud Professional Architect Certified"
                  multiline
                  rows={2}
                />
              </div>
              <button
                onClick={() => setAchievements(achievements.filter((_, i) => i !== idx))}
                className="mt-2 text-neutral-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // Tab: Mastery (Skills)
  // ─────────────────────────────────────────────
  const renderSkills = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* GitHub Sync Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 via-indigo-900/10 to-transparent border border-blue-500/15 rounded-2xl p-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">GitHub Skill Sync</span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-relaxed max-w-[220px]">
              Scans your repos &amp; README files to auto-discover technologies you've actually used.
            </p>
          </div>
          <button
            onClick={handleSuggestSkills}
            disabled={suggestingSkills}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 shadow-lg shadow-blue-600/25 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            {suggestingSkills ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <GitBranch className="w-3.5 h-3.5" />
            )}
            {suggestingSkills ? "Scanning..." : "Sync from GitHub"}
          </button>
        </div>
      </div>

      {/* Skill Categories */}
      {(["languages", "frameworks", "tools"] as (keyof CVSkills)[]).map((type) => {
        const labels: Record<string, string> = {
          languages: "Languages",
          frameworks: "Frameworks & Libraries",
          tools: "Tools & Platforms",
        };
        const placeholders: Record<string, string> = {
          languages: "e.g. Python, TypeScript, Go...",
          frameworks: "e.g. React, FastAPI, TensorFlow...",
          tools: "e.g. Docker, PostgreSQL, AWS...",
        };
        const colors: Record<string, string> = {
          languages: "bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/20",
          frameworks: "bg-sky-500/10 text-sky-300 border-sky-500/20 hover:bg-sky-500/20",
          tools: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20",
        };
        const dotColors: Record<string, string> = {
          languages: "bg-violet-400",
          frameworks: "bg-sky-400",
          tools: "bg-emerald-400",
        };

        return (
          <div key={type} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${dotColors[type]}`} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">
                {labels[type]}
              </span>
              <span className="text-[9px] text-neutral-700 font-bold">
                ({(skills[type] || []).length})
              </span>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 min-h-[44px] p-3 bg-[#0f0f0f] border border-white/[0.06] rounded-xl transition-all focus-within:border-white/15">
              {(skills[type] || []).map((s, i) => (
                <span
                  key={i}
                  className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${colors[type]}`}
                >
                  {s}
                  <button
                    onClick={() => removeSkill(type, i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-current hover:text-red-400"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {(skills[type] || []).length === 0 && (
                <span className="text-[10px] text-neutral-700 italic font-medium self-center">
                  No {labels[type].toLowerCase()} added yet
                </span>
              )}
            </div>

            {/* Add Input */}
            <div className="relative group">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      // Handle comma-separated batch input
                      const parts = val.split(",").map(v => v.trim()).filter(Boolean);
                      parts.forEach(part => addSkill(type, part));
                      e.currentTarget.value = "";
                    }
                  }
                }}
                placeholder={placeholders[type]}
                className="w-full bg-transparent border border-white/[0.06] group-hover:border-white/10 focus:border-blue-500/40 rounded-xl px-3.5 py-2.5 text-[11px] text-neutral-300 placeholder:text-neutral-700 outline-none transition-all font-medium"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                <kbd className="text-[8px] font-bold text-neutral-700 bg-white/5 px-1.5 py-0.5 rounded">Enter</kbd>
              </div>
            </div>
          </div>
        );
      })}

      {/* Skill validation runs silently in background */}

      {/* Smart Updates — GitHub AI suggestions below */}
      <div className="pt-6 border-t border-white/[0.04]">
        <p className="text-[10px] font-bold uppercase tracking-[2px] text-neutral-600 mb-4 px-1">Smart Skill Updates</p>
        <SmartUpdateCenter
          initialSuggestions={initialSuggestions}
          accessToken={accessToken}
          lastSyncAt={initialData.lastSyncAt || null}
          setProjects={setProjects}
          setSkills={setSkills}
          setIsSyncing={setIsSyncing}
          filterType="skill"
        />
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // Tab: Trajectory (Experience)
  // ─────────────────────────────────────────────
  const renderExperience = () => (
    <div className="space-y-6">
      {cv.experience.length === 0 && (
        <div className="text-center py-16 bg-[#111] border border-dashed border-white/5 rounded-[2rem] shadow-inner">
          <Briefcase className="w-10 h-10 text-neutral-800 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-neutral-600 text-sm font-bold mb-4 uppercase tracking-[2px]">Empty Trajectory</p>
          <button
            onClick={addExperience}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase text-neutral-400 hover:text-white transition-all border border-white/5"
          >
            Create First Node
          </button>
        </div>
      )}

      {cv.experience.map((exp, i) => (
        <div key={i} className="bg-[#121212] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-blue-500/20 transition-all shadow-lg">
          <div 
            onClick={() => setExpandedExperience(expandedExperience === i ? null : i)}
            className="px-6 py-4 flex items-center justify-between bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors border-b border-white/5"
          >
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-bold text-white truncate font-outfit">{exp.company || "New Experience"}</p>
              <div className="flex items-center gap-2 mt-0.5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#444] group-hover:text-blue-500 transition-colors uppercase truncate">{exp.title || "Position"}</p>
                 <span className="w-1 h-1 rounded-full bg-neutral-800" />
                 <p className="text-[10px] font-bold text-neutral-600 truncate">{exp.period || "No Dates Set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => removeExperience(i)} 
                className="p-2 text-neutral-700 hover:text-red-400 hover:bg-red-500/5 transition-all rounded-xl"
                title="Delete Experience"
              >
                 <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setExpandedExperience(expandedExperience === i ? null : i)}
                className="p-2 text-neutral-500 hover:text-white transition-colors"
                title={expandedExperience === i ? "Collapse" : "Expand"}
              >
                {expandedExperience === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {expandedExperience === i && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <SectionLabel>Company / Organization</SectionLabel>
                  <InlineEdit value={exp.company} onChange={(v) => updateExp(i, "company", v)} placeholder="Company Name" />
                </div>
                <div className="col-span-2">
                  <SectionLabel>Dates / Period</SectionLabel>
                  <ExperienceDatePicker value={exp.period} onChange={(v) => updateExp(i, "period", v)} />
                </div>
                <div className="col-span-2">
                  <SectionLabel>Job Title</SectionLabel>
                  <InlineEdit value={exp.title} onChange={(v) => updateExp(i, "title", v)} placeholder="Software Engineer / Technical Lead" />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>Achievements & Responsibilities</SectionLabel>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addExpBullet(i)}
                      className="text-[9px] font-black uppercase tracking-widest text-neutral-600 hover:text-white flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-lg transition-all"
                    >
                      <Plus className="w-3 h-3" /> Outcome
                    </button>
                    <button
                      onClick={() => handleGenerateExpBullets(i)}
                      disabled={generatingExpBullets === i}
                      className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/15 px-2.5 py-1 rounded-lg transition-all border border-blue-500/10 disabled:opacity-50"
                    >
                      {generatingExpBullets === i ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {generatingExpBullets === i ? "Generating..." : "✦ AI Generate"}
                    </button>
                  </div>
                </div>
                {/* Optional context hint for better AI output */}
                <div className="mb-3">
                  <input
                    value={expContext[i] || ""}
                    onChange={(e) => setExpContext(prev => ({ ...prev, [i]: e.target.value }))}
                    placeholder="Optional: hint the AI (e.g. 'Built ML dashboard, used Streamlit and Python')..."
                    className="w-full bg-transparent border-b border-white/5 px-2 py-2 text-[11px] text-neutral-500 placeholder:text-neutral-700 outline-none focus:border-blue-500/30 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  {exp.bullets.map((b, j) => (
                    <div key={j} className="flex gap-3 items-start group/bullet">
                      <div className="mt-4 w-1.5 h-1.5 rounded-full bg-neutral-800 shrink-0 group-hover/bullet:bg-blue-500 transition-colors shadow-[0_0_8px_rgba(37,99,235,0)] group-hover/bullet:shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                      <InlineEdit
                        value={b}
                        onChange={(v) => updateExpBullet(i, j, v)}
                        placeholder="Achieved X by implementing Y resulting in Z% growth."
                        multiline
                        rows={2}
                        className="flex-1 text-[13px] !bg-white/[0.02] hover:!bg-white/[0.04]"
                      />
                      <button
                        onClick={() => removeExpBullet(i, j)}
                        className="mt-3 text-neutral-800 hover:text-red-400 transition-all opacity-0 group-hover/bullet:opacity-100 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addExperience}
        className="w-full h-20 flex flex-col items-center justify-center gap-1 border border-dashed border-white/5 hover:border-blue-500/30 bg-white/[0.01] hover:bg-blue-500/5 rounded-[2rem] text-neutral-600 hover:text-blue-400 transition-all duration-300 group"
      >
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[2px]">Append Career Node</span>
      </button>
    </div>
  );

  // ─────────────────────────────────────────────
  // Tab: Projects
  // ─────────────────────────────────────────────
  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-neutral-500">Live Builds</p>
          {isSyncing && (
            <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <Loader2 className="w-2 h-2 text-blue-400 animate-spin" />
              <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Syncing...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.location.reload()}
            className="text-[10px] font-bold text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {projects.map((p, pIdx) => {
        return (
          <div
            key={p.id}
            className={`border rounded-[2rem] overflow-hidden transition-all duration-500 shadow-xl ${
              p.included === false
                ? "border-white/5 bg-black/40 opacity-40 hover:opacity-70 scale-[0.98]"
                : "border-white/5 bg-[#121212] hover:border-blue-500/30"
            }`}
          >
            <div
              className="px-7 py-5 flex items-center justify-between cursor-pointer group/header"
              onClick={() => setExpandedProject(expandedProject === pIdx ? null : pIdx)}
            >
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-3">
                  <p className="text-[15px] font-bold text-white truncate font-outfit tracking-tight">{p.title || "Untitled Project"}</p>
                  {p.included === false && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded-lg border border-white/5">Excluded</span>}
                  {p.aiGenerated && <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/10">AI</span>}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-neutral-600 mt-1">{(p.techStack || []).join(" • ")}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); updateProject(pIdx, "included", !p.included); }}
                  className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all border ${p.included === false ? "text-neutral-700 bg-white/5 border-white/5" : "text-blue-400 bg-blue-500/5 border-blue-500/10"}`}
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this project?")) {
                      setProjects(projects.filter((_, i) => i !== pIdx));
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 transition-transform ${expandedProject === pIdx ? 'rotate-180' : ''}`}>
                   <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>

            {expandedProject === pIdx && (
              <div className="p-7 space-y-6 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <SectionLabel>Project Title</SectionLabel>
                    <InlineEdit value={p.title} onChange={(v) => updateProject(pIdx, "title", v)} placeholder="Project Title" />
                  </div>
                  <div>
                    <SectionLabel>Tech Stack</SectionLabel>
                  <InlineEdit 
                    value={Array.isArray(p.techStack) ? p.techStack.join(", ") : (p.techStack || "")} 
                    onChange={(v) => updateProject(pIdx, "techStack", v.split(",").map(t => t.trim()).filter(Boolean))} 
                    placeholder="React, TypeScript, ..." 
                  />
                  </div>
                </div>
                <div>
                  <SectionLabel>Description</SectionLabel>
                  <InlineEdit value={p.description || ""} onChange={(v) => updateProject(pIdx, "description", v)} placeholder="A brief technical overview..." />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <SectionLabel>Project Highlights</SectionLabel>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { const nu = [...(p.highlights || []), ""]; updateProject(pIdx, "highlights", nu); }} className="text-[10px] font-bold text-neutral-500 hover:text-white transition-colors mr-1">+ Add Bullet</button>
                      <button
                        onClick={() => handleGenerateProjectFromReadme(pIdx)}
                        disabled={generatingProjectFromReadme === pIdx}
                        className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/15 px-2.5 py-1 rounded-lg transition-all border border-blue-500/10 disabled:opacity-50"
                      >
                        {generatingProjectFromReadme === pIdx ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {generatingProjectFromReadme === pIdx ? "Syncing..." : "✦ Sync README"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(p.highlights || []).map((h, bIdx) => (
                      <div key={bIdx} className="flex gap-2 group/bullet">
                        <div className="flex-1">
                          <InlineEdit value={h} onChange={(v) => { const nu = [...(p.highlights || [])]; nu[bIdx] = v; updateProject(pIdx, "highlights", nu); }} placeholder="Describe achievement..." multiline />
                        </div>
                        <button onClick={() => { const nu = (p.highlights || []).filter((_, i) => i !== bIdx); updateProject(pIdx, "highlights", nu); }} className="opacity-0 group-hover/bullet:opacity-100 p-2 text-neutral-600 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {projects.length === 0 && (
        <div className="text-center py-16 bg-[#111] border border-dashed border-white/5 rounded-[2rem]">
          <Terminal className="w-10 h-10 text-neutral-800 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-neutral-600 text-sm font-bold mb-4 uppercase tracking-[2px]">No Active Builds</p>
          <button onClick={() => setProjects([{ id: Math.random().toString(), title: "", description: "", techStack: [], highlights: [""] }])} className="px-8 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-neutral-400 hover:text-white transition-all border border-white/5">Initiate Project</button>
        </div>
      )}

      <div className="pt-8 border-t border-white/5">
        <p className="text-[10px] font-bold uppercase tracking-[2px] text-neutral-500 mb-4 px-2">Smart Project Updates</p>
        <SmartUpdateCenter 
          initialSuggestions={initialSuggestions} 
          accessToken={accessToken} 
          lastSyncAt={initialData.lastSyncAt || null} 
          setProjects={setProjects}
          setSkills={setSkills}
          setIsSyncing={setIsSyncing}
          filterType="project"
        />
      </div>
    </div>
  );


  // ─────────────────────────────────────────────
  // Tab: Tailor
  // ─────────────────────────────────────────────
  const renderTailor = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-blue-600/5 border border-blue-600/10 rounded-[2rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl" />
        <h3 className="text-xl font-bold text-white mb-2 font-outfit">Job Description Specializer</h3>
        <p className="text-sm text-blue-200/50 leading-relaxed mb-6">
          Paste the job description below. Our AI will align your summary, skills, and projects to match the recruiter's specific requirements.
        </p>

        <div className="space-y-5">
          <div>
            <SectionLabel>Target Job Title</SectionLabel>
            <input 
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full bg-neutral-900/60 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/40 transition-all"
            />
          </div>
          <div>
            <SectionLabel>Full Job Description</SectionLabel>
            <textarea 
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the JD here..."
              rows={10}
              className="w-full bg-neutral-900/60 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/40 transition-all resize-none"
            />
          </div>
          
          <button
            onClick={handleTailorResume}
            disabled={isTailoring || !jdText}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
          >
            {isTailoring ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isTailoring ? "Orchestrating Tailored Version..." : "Generate Optimized Version"}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
         <div className="p-6 bg-white/5 border border-white/5 rounded-[1.5rem]">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Benefit 01</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">Keywords are automatically injected into your skills and summary to pass ATS filters.</p>
         </div>
         <div className="p-6 bg-white/5 border border-white/5 rounded-[1.5rem]">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Benefit 02</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">Your professional summary is rewritten to solve the specific pain points mentioned in the JD.</p>
         </div>
      </div>
    </div>
  );

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "skills", label: "Skills", icon: <Cpu className="w-4 h-4" /> },
    { id: "experience", label: "Experience", icon: <Briefcase className="w-4 h-4" /> },
    { id: "projects", label: "Projects", icon: <div className="relative"><Code className="w-4 h-4" />{projects.length > 0 && <span className="absolute -top-2 -right-2 bg-blue-500 text-[8px] px-1 rounded-full">{projects.length}</span>}</div> },
    { id: "education", label: "Education", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "tailor", label: "Match Job", icon: <Sparkles className="w-4 h-4" /> },
  ];

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#050505] text-[#e5e5e5] overflow-hidden font-inter selection:bg-blue-500/30">
      {/* ── Left Sidebar Header ── */}
      <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-white/[0.03] bg-[#0a0a0a] shadow-[10px_0_40px_rgba(0,0,0,0.4)] z-20">
        {/* Superior Header */}
        <header className="px-6 py-5 flex items-center justify-between border-b border-white/[0.03] relative bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-blue-600/5 blur-[80px] pointer-events-none" />
          <div className="flex items-center gap-3 relative">
             <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] transform rotate-3">
               <Rocket className="w-5 h-5 text-white" />
             </div>
            <div className="flex flex-col">
               <span className="font-black text-lg tracking-tighter font-outfit uppercase leading-none">
                 RESUMMIT<span className="text-blue-500">AI</span>
               </span>
               <span className="text-[8px] font-black uppercase tracking-[3px] text-neutral-600 mt-1">Core Engine V2</span>
            </div>
          </div>
          <div className="flex items-center gap-3 relative">
            <SaveIndicator />
          </div>
        </header>

        {/* CV Quality Warnings */}
        <CvWarningBanner />

        {/* Global Action Bar */}
        <div className="px-6 py-4 border-b border-white/[0.03] flex flex-col gap-4 bg-white/[0.01]">
            <div className="flex items-center justify-between">
               {atsData ? (
                 <button
                   onClick={() => setAtsPanelOpen(true)}
                   className={`px-3 py-1.5 rounded-xl border transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${
                     atsData.score >= 70
                       ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                       : "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                   }`}
                 >
                   <Target className="w-3 h-3" />
                   {atsData.score} Score
                 </button>
               ) : (
                 <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-neutral-600 text-[9px] font-black uppercase animate-pulse flex items-center gap-2">
                   <Loader2 className="w-3 h-3 animate-spin" /> Scoring
                 </div>
               )}

               <button
                 onClick={handleExportPDF}
                 disabled={isExporting}
                 className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 transition-all px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
               >
                 {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                 Export
               </button>
            </div>

            <div className="flex bg-neutral-900 p-1 rounded-xl border border-white/5 relative overflow-hidden h-10">
              <div 
                className={`absolute top-1 bottom-1 transition-all duration-500 ease-out rounded-lg ${
                  mode === "non-specialized" ? "left-1 w-[49%] bg-white" : "left-[50%] w-[49%] bg-blue-600"
                }`}
              />
              <button
                onClick={() => setMode("non-specialized")}
                className={`relative z-10 flex-1 py-1 text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                  mode === "non-specialized" ? "text-black" : "text-neutral-500 hover:text-white"
                }`}
              >
                Non-Specialized
              </button>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="relative z-10 flex-1 py-1 text-[9px] font-black uppercase tracking-widest transition-all duration-500 text-neutral-500 hover:text-neutral-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Specialized</span>
                <Lock className="w-2.5 h-2.5 text-neutral-600 shrink-0" />
              </button>
            </div>
        </div>

        <div className="flex bg-black px-2 py-2 gap-1 border-b border-white/[0.03]">
          {tabs.filter(t => t.id !== "tailor").map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EditorTab)}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-[8px] font-black uppercase tracking-widest transition-all rounded-xl border ${
                activeTab === tab.id
                  ? "bg-blue-600/10 border-blue-600/30 text-blue-400"
                  : "bg-transparent border-transparent text-neutral-600 hover:text-neutral-400"
              }`}
            >
              {tab.icon}
              <span className="mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Context Window */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 custom-scrollbar">
          {activeTab === "profile" && renderProfile()}
          {activeTab === "skills" && renderSkills()}
          {activeTab === "experience" && renderExperience()}
          {activeTab === "projects" && renderProjects()}
          {activeTab === "education" && renderEducation()}
        </div>
      </div>

      {/* ── Right Panel: Precision CV Preview ── */}
      <div className="flex-1 bg-[#1a1a1a] overflow-y-auto flex px-12 py-16 justify-center items-start custom-scrollbar">
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-600/5 blur-[120px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <ResumePreview 
            data={cv} 
            projects={projects} 
            template="formal"
            mode={mode}
          />
        </div>
      </div>

      {/* Audit Modal Reveal */}
      {atsPanelOpen && atsData && (
        <ATSPanel data={atsData} onClose={() => setAtsPanelOpen(false)} />
      )}

      {/* Specialized Coming Soon Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="w-[440px] bg-[#0c0c0e] border border-white/[0.08] p-8 rounded-[2.5rem] relative overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.15)] transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />
            
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white rounded-full hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center text-center mt-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.3)] mb-6 relative group">
                <span className="absolute inset-0 rounded-3xl bg-blue-500 animate-ping opacity-25" />
                <Sparkles className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              
              <h3 className="font-extrabold text-xl tracking-tight uppercase text-white font-outfit mb-3">
                Specialized Tuning Coming Soon
              </h3>
              
              <p className="text-neutral-400 text-xs leading-relaxed max-w-sm mb-8">
                We are currently training our specialized AI models to compile role-specific resume hierarchies with absolute high-signal metrics. Stay tuned!
              </p>
              
              <div className="w-full space-y-4 mb-8 text-left bg-white/[0.02] border border-white/[0.04] p-5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-white">Role-Specific Tuning</h4>
                    <p className="text-[9px] text-neutral-500 mt-1 leading-normal">Tailor experience, skills, and bullets for Frontend, Backend, ML, or Mobile domains.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Cpu className="w-3 h-3 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-white">Recruiter Calibration</h4>
                    <p className="text-[9px] text-neutral-500 mt-1 leading-normal">Verify stack confidence ratios and score compatibility against specific hiring target profiles.</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full">
                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Stay Tuned
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
}
