"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, ArrowRight, Zap, AlertCircle, RefreshCw, Loader2, Save, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Suggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  proposedData: string;
  currentData: string | null;
  confidence: number;
  priority: number;
  createdAt?: string | Date;
  entityId?: string | null;
}

export function SmartUpdateCenter({
  initialSuggestions,
  lastSyncAt,
  accessToken,
  setProjects,
  setSkills,
  setIsSyncing,
  isSyncing,
  filterType,
}: {
  initialSuggestions: Suggestion[];
  lastSyncAt: string | null;
  accessToken?: string;
  setProjects?: (projects: any) => void;
  setSkills?: (skills: any) => void;
  setIsSyncing?: (syncing: boolean) => void;
  isSyncing?: boolean;
  filterType?: "project" | "skill";
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<Suggestion | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "projects" | "skills">("all");

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const isCurrentlySyncing = isSyncing !== undefined ? isSyncing : scanning;

  const getPushedTime = (s: Suggestion) => {
    try {
      if (s.proposedData) {
        const parsed = JSON.parse(s.proposedData);
        if (parsed.pushedAt) {
          return new Date(parsed.pushedAt).getTime();
        }
      }
    } catch (e) {
      // ignore JSON parse errors
    }
    return s.createdAt ? new Date(s.createdAt).getTime() : 0;
  };

  const formatPushedTime = (timeMs: number) => {
    if (timeMs === 0) return null;
    const now = Date.now();
    const diff = now - timeMs;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (diff < 60000) return "Just updated";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(timeMs).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // KEEP STATE IN SYNC WITH SERVER PROPS
  useEffect(() => {
    setSuggestions(initialSuggestions);
  }, [initialSuggestions]);

  // AUTO-SYNC TOKEN: Ensure server has our latest token
  useEffect(() => {
    const sessionToken = (session?.user as any)?.accessToken;
    if (sessionToken) {
      console.log("[GITHUB] Syncing token from session...");
      fetch("/api/github/sync-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: sessionToken }),
      }).catch(console.error);
    }
  }, [session]);

  // AUTO-FETCH: Automatically scan on mount if we have no suggestions and no recent sync
  useEffect(() => {
    const hasToken = accessToken || (session?.user as any)?.accessToken;
    if (!lastSyncAt && suggestions.length === 0 && hasToken && !scanning) {
      console.log("[GITHUB] Auto-scanning on mount...");
      handleScan();
    }
  }, [session, accessToken]);

  const addSystemNotification = (title: string, desc: string, type: "success" | "info" | "warning") => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("sclade-notifications");
    let currentList: any[] = [];
    if (saved) {
      try {
        currentList = JSON.parse(saved);
      } catch (e) {
        currentList = [];
      }
    } else {
      currentList = [
        {
          id: "1",
          title: "GitHub Sync Successful",
          desc: "Successfully parsed 12 repositories and README assets.",
          time: "Just now",
          read: false,
          type: "success",
        },
        {
          id: "2",
          title: "ATS Resume Audit Complete",
          desc: "Semantic intelligence score increased to 82/100.",
          time: "10 mins ago",
          read: false,
          type: "info",
        },
        {
          id: "3",
          title: "Gemini Key Status Active",
          desc: "Google generative developer endpoints verified.",
          time: "1 hour ago",
          read: true,
          type: "success",
        },
      ];
    }
    const newNotif = {
      id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
      title,
      desc,
      time: "Just now",
      read: false,
      type,
    };
    const updatedList = [newNotif, ...currentList];
    localStorage.setItem("sclade-notifications", JSON.stringify(updatedList));
    window.dispatchEvent(new Event("sclade-notifications-updated"));
  };

  const handleScan = async () => {
    if (setIsSyncing) setIsSyncing(true);
    if (isMounted.current) {
      setScanning(true);
      setScanError(null);
    }
    try {
      const res = await fetch("/api/github/sync");
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      const syncResult = data.result || {};
      const count = typeof syncResult.count === "number" ? syncResult.count : (typeof data.count === "number" ? data.count : 0);
      const skipped = !!syncResult.skipped;

      if (!skipped) {
        if (count > 0) {
          addSystemNotification(
            "GitHub Discoveries Found",
            `Successfully scanned public repositories and identified ${count} new suggestion(s) matching your profile.`,
            "success"
          );
        } else {
          addSystemNotification(
            "GitHub Scan Complete",
            "Scanned all public repositories. No new suggestions were generated as your profile is fully up to date.",
            "info"
          );
        }
      }
      
      // Refresh the page to see new suggestions or fetch them
      router.refresh();
      
      // If we have a direct suggestions list, update it
      if (count === 0 && isMounted.current) {
        setScanError("No new updates found at this time.");
      }
    } catch (err: any) {
      if (isMounted.current) {
        setScanError(err.message || "Failed to scan GitHub");
      }
      addSystemNotification(
        "GitHub Scan Failed",
        err.message || "Failed to complete GitHub sync scanning due to a system or network error.",
        "warning"
      );
    } finally {
      if (isMounted.current) {
        setScanning(false);
      }
      if (setIsSyncing) setIsSyncing(false);
    }
  };

  const handleApprove = async (id: string, proposed: any) => {
    try {
      const res = await fetch("/api/suggestions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, proposed }),
      });
      const data = await res.json();
      
      if (data.success) {
        const currentReviewing = reviewing;

        if (isMounted.current) {
          setSuggestions((prev) => prev.filter((s) => s.id !== id));
          setReviewing(null);
        }
        
        // REACTIVE UPDATE: If we have setter functions, update the parent state directly
        if (data.project && setProjects) {
          setProjects((prev: any[]) => {
             if (currentReviewing?.type === "IMPROVE_PROJECT" && currentReviewing.entityId) {
               return prev.map(p => p.id === currentReviewing.entityId ? { ...p, ...data.project, id: p.id } : p);
             } else {
               const exists = prev.some(p => p.title.toLowerCase() === data.project.title.toLowerCase());
               if (exists) return prev;
               return [data.project, ...prev];
             }
          });
        }

        
        // For skills — merge and deduplicate case-insensitively
        if (data.skills && setSkills) {
          setSkills((prev: any) => {
            const mergeUnique = (existing: string[], incoming: string[]) => {
              const seen = new Set((existing || []).map((x: string) => x.toLowerCase()));
              const result = [...(existing || [])];
              for (const item of (incoming || [])) {
                if (item && !seen.has(item.toLowerCase())) {
                  result.push(item);
                  seen.add(item.toLowerCase());
                }
              }
              return result;
            };
            return {
              languages: mergeUnique(prev?.languages || [], data.skills.languages || []),
              frameworks: mergeUnique(prev?.frameworks || [], data.skills.frameworks || []),
              tools: mergeUnique(prev?.tools || [], data.skills.tools || []),
            };
          });
        }


        router.refresh();
      }
    } catch (err) {
      console.error("Failed to approve suggestion", err);
    }
  };

  const handleDiscard = async (id: string) => {
    try {
      await fetch("/api/suggestions/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (isMounted.current) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        setReviewing(null);
      }
    } catch (err) {
      console.error("Failed to discard suggestion", err);
      // Still filter locally for better UX
      if (isMounted.current) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        setReviewing(null);
      }
    }
  };

  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const timeA = getPushedTime(a);
    const timeB = getPushedTime(b);
    return timeB - timeA;
  });

  const projectSuggestions = sortedSuggestions
    .filter(s => s.type === "NEW_PROJECT" || s.type === "IMPROVE_PROJECT")
    .filter((s, i, arr) => arr.findIndex(t => t.title === s.title) === i);

  const skillSuggestions = sortedSuggestions
    .filter(s => s.type === "ADD_SKILL")
    .filter((s, i, arr) => arr.findIndex(t => t.title === s.title) === i);

  const filteredSuggestions = filterType === "skill"
    ? skillSuggestions
    : filterType === "project"
      ? projectSuggestions
      : sortedSuggestions;

  if (filteredSuggestions.length === 0 && !isCurrentlySyncing) {
    return (
      <div className="bg-[var(--sclade-card-bg)] border border-[var(--sclade-card-border)] rounded-2xl p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[var(--sclade-text-secondary)] mx-auto mb-3" />
        <p className="text-[11px] text-[var(--sclade-text-secondary)] mb-4 uppercase tracking-wider font-bold">
          {scanError || (filterType === "skill" 
            ? "Your skills are up to date with your GitHub." 
            : filterType === "project" 
              ? "Your projects are up to date with your GitHub." 
              : "Your resume is up to date with your GitHub activity.")
          }
        </p>
        <button
          onClick={handleScan}
          className="px-4 py-2 bg-[var(--sclade-btn-secondary-bg)] border border-[var(--sclade-card-border)] hover:bg-[var(--sclade-card-bg)] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all text-[var(--sclade-text-primary)] cursor-pointer"
        >
          {filterType === "skill" ? "Scan Skills" : filterType === "project" ? "Scan Projects" : "Check for updates"}
        </button>
      </div>
    );
  }

  const renderSuggestionCard = (suggestion: Suggestion) => {
    const pushedTime = getPushedTime(suggestion);
    return (
      <div 
        key={suggestion.id}
        className="group relative bg-[var(--sclade-card-bg)] border border-[var(--sclade-card-border)] hover:border-blue-500/20 rounded-3xl p-5 transition-all shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-black text-[var(--sclade-text-primary)] uppercase tracking-wider mb-1.5 break-words">
              {suggestion.title.replace(/_/g, " ")}
            </h4>
            <p className="text-[10.5pt] text-[var(--sclade-text-secondary)] leading-relaxed font-light line-clamp-2">
              {suggestion.description}
            </p>
            <div className="flex items-center gap-2 mt-3.5">
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {Math.round(suggestion.confidence * 100)}%
              </span>
              {pushedTime > 0 && (
                <span className="text-[9px] font-black text-[var(--sclade-text-secondary)] uppercase tracking-wider">
                  • {formatPushedTime(pushedTime)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setReviewing(suggestion)}
              className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95"
            >
              Review
            </button>
            <button
              onClick={() => handleDiscard(suggestion.id)}
              className="p-2 text-[var(--sclade-text-muted)] hover:text-red-500 transition-colors cursor-pointer self-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {filterType ? (
        <div className="space-y-4">
          {/* Header with quick Rescan/Sync action */}
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
            <span className="text-[9px] font-black text-[var(--sclade-text-secondary)] uppercase tracking-[0.2em]">
              {filterType === "skill" ? `Skill Discoveries (${filteredSuggestions.length})` : `Project Discoveries (${filteredSuggestions.length})`}
            </span>
            {!isCurrentlySyncing && (
              <button
                onClick={handleScan}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--sclade-btn-secondary-bg)] border border-[var(--sclade-card-border)] hover:bg-[var(--sclade-card-bg)] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-[var(--sclade-text-secondary)] hover:text-[var(--sclade-text-primary)] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                {filterType === "skill" ? "Rescan Skills" : filterType === "project" ? "Rescan Projects" : "Rescan"}
              </button>
            )}
          </div>

          {isCurrentlySyncing && (
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-pulse">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                {filterType === "skill" ? "Scanning Skills..." : "Scanning Projects..."}
              </span>
            </div>
          )}

          {!isCurrentlySyncing && (
            <div className="space-y-4">
              {filteredSuggestions.map((suggestion) => renderSuggestionCard(suggestion))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tab Switcher & Rescan Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-5">
            <div className="flex items-center gap-1.5 p-1 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl self-start">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-neutral-950 text-white dark:bg-white dark:text-black shadow-lg"
                    : "text-[var(--sclade-text-secondary)] hover:text-[var(--sclade-text-primary)]"
                }`}
              >
                All Discoveries ({suggestions.length})
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "projects"
                    ? "bg-neutral-950 text-white dark:bg-white dark:text-black shadow-lg"
                    : "text-[var(--sclade-text-secondary)] hover:text-[var(--sclade-text-primary)]"
                }`}
              >
                Projects ({projectSuggestions.length})
              </button>
              <button
                onClick={() => setActiveTab("skills")}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "skills"
                    ? "bg-neutral-950 text-white dark:bg-white dark:text-black shadow-lg"
                    : "text-[var(--sclade-text-secondary)] hover:text-[var(--sclade-text-primary)]"
                }`}
              >
                Skills ({skillSuggestions.length})
              </button>
            </div>

            {!isCurrentlySyncing && suggestions.length > 0 && (
              <button
                onClick={handleScan}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--sclade-btn-secondary-bg)] border border-[var(--sclade-card-border)] hover:bg-[var(--sclade-card-bg)] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-[var(--sclade-text-secondary)] hover:text-[var(--sclade-text-primary)] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Rescan GitHub
              </button>
            )}
          </div>

          {isCurrentlySyncing && (
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-pulse">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">AI is scanning your GitHub...</span>
            </div>
          )}

          {!isCurrentlySyncing && (
            <>
              {activeTab === "all" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Projects Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3 mb-1">
                      <h3 className="text-[10px] font-black text-[var(--sclade-text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Rocket className="w-3.5 h-3.5 text-blue-500" />
                        Project Suggestions ({projectSuggestions.length})
                      </h3>
                    </div>

                    {projectSuggestions.length === 0 ? (
                      <div className="text-center py-10 bg-black/[0.01] dark:bg-white/[0.01] border border-[var(--sclade-card-border)] rounded-3xl">
                        <Check className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-[10px] text-[var(--sclade-text-secondary)] uppercase tracking-wider font-bold">
                          All projects up to date
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {projectSuggestions.map((suggestion) => renderSuggestionCard(suggestion))}
                      </div>
                    )}
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3 mb-1">
                      <h3 className="text-[10px] font-black text-[var(--sclade-text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Skill Suggestions ({skillSuggestions.length})
                      </h3>
                    </div>

                    {skillSuggestions.length === 0 ? (
                      <div className="text-center py-10 bg-black/[0.01] dark:bg-white/[0.01] border border-[var(--sclade-card-border)] rounded-3xl">
                        <Check className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-[10px] text-[var(--sclade-text-secondary)] uppercase tracking-wider font-bold">
                          All skills up to date
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {skillSuggestions.map((suggestion) => renderSuggestionCard(suggestion))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "projects" ? (
                projectSuggestions.length === 0 ? (
                  <div className="text-center py-12 bg-black/[0.01] dark:bg-white/[0.01] border border-[var(--sclade-card-border)] rounded-3xl">
                    <AlertCircle className="w-8 h-8 text-[var(--sclade-text-secondary)] mx-auto mb-3" />
                    <p className="text-[10px] text-[var(--sclade-text-secondary)] uppercase tracking-widest font-black">
                      No project discoveries found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {projectSuggestions.map((suggestion) => renderSuggestionCard(suggestion))}
                  </div>
                )
              ) : (
                skillSuggestions.length === 0 ? (
                  <div className="text-center py-12 bg-black/[0.01] dark:bg-white/[0.01] border border-[var(--sclade-card-border)] rounded-3xl">
                    <AlertCircle className="w-8 h-8 text-[var(--sclade-text-secondary)] mx-auto mb-3" />
                    <p className="text-[10px] text-[var(--sclade-text-secondary)] uppercase tracking-widest font-black">
                      No skill discoveries found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {skillSuggestions.map((suggestion) => renderSuggestionCard(suggestion))}
                  </div>
                )
              )}
            </>
          )}
        </>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--sclade-bg)] border border-[var(--sclade-card-border)] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-[var(--sclade-text-primary)] uppercase tracking-[2px] mb-1">Review AI Suggestion</h3>
                  <p className="text-[10px] text-[var(--sclade-text-secondary)] uppercase tracking-wider">{reviewing.type.replace('_', ' ')}</p>
                </div>
                <button 
                  onClick={() => setReviewing(null)}
                  className="p-2 hover:bg-[var(--sclade-card-bg)] border border-[var(--sclade-card-border)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--sclade-text-secondary)]" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-[var(--sclade-input-bg)] border border-[var(--sclade-input-border)] rounded-2xl">
                  <h5 className="text-[10px] font-bold text-[var(--sclade-text-secondary)] uppercase tracking-widest mb-3">AI Proposed Changes</h5>
                  <div className="text-xs text-[var(--sclade-text-primary)] leading-relaxed">
                    {/* Render specific fields based on type */}
                    {reviewing.type === 'NEW_PROJECT' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-bold text-[var(--sclade-text-secondary)] uppercase mb-1">Project Name</p>
                          <p className="font-bold">{JSON.parse(reviewing.proposedData).title}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-[var(--sclade-text-secondary)] uppercase mb-1">Description</p>
                          <p>{JSON.parse(reviewing.proposedData).description}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-[var(--sclade-text-secondary)] uppercase mb-1">Key Highlights</p>
                          <ul className="list-disc pl-4 mt-2 space-y-1">
                            {(JSON.parse(reviewing.proposedData).highlights || []).map((h: string, i: number) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {reviewing.type === 'IMPROVE_PROJECT' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-bold text-[var(--sclade-text-secondary)] uppercase mb-1">Project Name</p>
                          <p className="font-bold">{JSON.parse(reviewing.proposedData).title}</p>
                        </div>
                        {reviewing.currentData && (
                          <div className="border border-red-500/20 bg-red-500/[0.02] p-4 rounded-xl">
                            <p className="text-[9px] font-bold text-red-400 uppercase mb-2">Current Project Highlights</p>
                            <ul className="list-disc pl-4 space-y-1 text-red-500/80">
                              {(() => {
                                try {
                                  const parsed = JSON.parse(reviewing.currentData);
                                  return (parsed.bullets || parsed.highlights || []).map((h: string, i: number) => (
                                    <li key={i}>{h}</li>
                                  ));
                                } catch (e) {
                                  return <li>No highlights set</li>;
                                }
                              })()}
                            </ul>
                          </div>
                        )}
                        <div className="border border-emerald-500/20 bg-emerald-500/[0.02] p-4 rounded-xl">
                          <p className="text-[9px] font-bold text-emerald-400 uppercase mb-2">AI Proposed Highlights</p>
                          <ul className="list-disc pl-4 space-y-1 text-emerald-500/90">
                            {(JSON.parse(reviewing.proposedData).highlights || []).map((h: string, i: number) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {reviewing.type === 'ADD_SKILL' && (
                      <div className="space-y-4">
                        {Object.entries(JSON.parse(reviewing.proposedData)).map(([cat, skills]: [string, any]) => (
                          skills.length > 0 && (
                            <div key={cat}>
                              <p className="text-[9px] font-bold text-[var(--sclade-text-secondary)] uppercase mb-2">{cat}</p>
                              <div className="flex flex-wrap gap-2">
                                {skills.map((s: string) => (
                                  <span key={s} className="px-2 py-1 bg-[var(--sclade-card-bg)] border border-[var(--sclade-card-border)] rounded-lg text-[10px] font-bold">{s}</span>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleApprove(reviewing.id, JSON.parse(reviewing.proposedData))}
                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-[2px] transition-all shadow-xl shadow-emerald-900/20"
                  >
                    <Check className="w-4 h-4" />
                    Approve & Sync
                  </button>
                  <button
                    onClick={() => handleDiscard(reviewing.id)}
                    className="px-8 py-4 bg-[var(--sclade-btn-secondary-bg)] border border-[var(--sclade-card-border)] hover:bg-red-500/10 text-[var(--sclade-text-secondary)] hover:text-red-400 rounded-2xl text-xs font-bold uppercase tracking-[2px] transition-all"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
