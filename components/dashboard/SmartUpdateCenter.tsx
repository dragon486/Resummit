"use client";

import { useState, useEffect } from "react";
import { Check, X, ArrowRight, Zap, AlertCircle, RefreshCw, Loader2, Save } from "lucide-react";
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
}

export function SmartUpdateCenter({
  initialSuggestions,
  lastSyncAt,
  accessToken,
  setProjects,
  setSkills,
  setIsSyncing,
  filterType,
}: {
  initialSuggestions: Suggestion[];
  lastSyncAt: string | null;
  accessToken?: string;
  setProjects?: (projects: any) => void;
  setSkills?: (skills: any) => void;
  setIsSyncing?: (syncing: boolean) => void;
  filterType?: "project" | "skill";
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<Suggestion | null>(null);

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

  const handleScan = async () => {
    if (setIsSyncing) setIsSyncing(true);
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch("/api/github/sync");
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      // Refresh the page to see new suggestions or fetch them
      router.refresh();
      
      // If we have a direct suggestions list, update it
      if (data.count === 0) {
        setScanError("No new updates found at this time.");
      }
    } catch (err: any) {
      setScanError(err.message || "Failed to scan GitHub");
    } finally {
      setScanning(false);
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
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        setReviewing(null);
        
        // REACTIVE UPDATE: If we have setter functions, update the parent state directly
        if (data.project && setProjects) {
          setProjects((prev: any[]) => {
             const exists = prev.some(p => p.title.toLowerCase() === data.project.title.toLowerCase());
             if (exists) return prev;
             return [data.project, ...prev];
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
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      setReviewing(null);
    } catch (err) {
      console.error("Failed to discard suggestion", err);
      // Still filter locally for better UX
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      setReviewing(null);
    }
  };

  if (suggestions.length === 0 && !scanning) {
    return (
      <div className="bg-[var(--sclade-card-bg)] border border-[var(--sclade-card-border)] rounded-2xl p-6 text-center">
        <RefreshCw className="w-8 h-8 text-[var(--sclade-text-secondary)] mx-auto mb-3" />
        <p className="text-xs text-[var(--sclade-text-secondary)] mb-4">
          {scanError || "Your resume is up to date with your GitHub activity."}
        </p>
        <button
          onClick={handleScan}
          className="px-4 py-2 bg-[var(--sclade-btn-secondary-bg)] border border-[var(--sclade-card-border)] hover:bg-[var(--sclade-card-bg)] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all text-[var(--sclade-text-primary)]"
        >
          Check for updates
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scanning && (
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-pulse">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">AI is scanning your GitHub...</span>
        </div>
      )}

      {!scanning && suggestions.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleScan}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--sclade-btn-secondary-bg)] border border-[var(--sclade-card-border)] hover:bg-[var(--sclade-card-bg)] rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all text-[var(--sclade-text-secondary)] hover:text-[var(--sclade-text-primary)]"
          >
            <RefreshCw className="w-3 h-3" />
            Rescan GitHub
          </button>
        </div>
      )}

      {!scanning && suggestions
        .filter(s => {
          if (!filterType) return true;
          if (filterType === "project") return s.type === "NEW_PROJECT" || s.type === "IMPROVE_PROJECT";
          return s.type === "ADD_SKILL";
        })
        .filter((s, i, arr) => arr.findIndex(t => t.title === s.title) === i)
        .sort((a, b) => b.confidence - a.confidence)
        .map((suggestion) => (
        <div 
          key={suggestion.id}
          className="group relative bg-[var(--sclade-card-bg)] border border-[var(--sclade-card-border)] hover:border-blue-500/20 rounded-2xl p-4 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-black text-[var(--sclade-text-primary)] uppercase tracking-wider mb-1 break-words">
                {suggestion.title.replace(/_/g, " ")}
              </h4>
              <p className="text-[10px] text-[var(--sclade-text-secondary)] leading-relaxed line-clamp-2">
                {suggestion.description}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase">
                  {Math.round(suggestion.confidence * 100)}% Confidence
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setReviewing(suggestion)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Review
              </button>
              <button
                onClick={() => handleDiscard(suggestion.id)}
                className="p-2 text-[var(--sclade-text-muted)] hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

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
