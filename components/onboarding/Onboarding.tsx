"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, 
  GitBranch, 
  Link as LinkIcon, 
  ArrowRight, 
  Sparkles, 
  Search, 
  Cpu, 
  Database, 
  Layout, 
  Shield, 
  Zap,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Step = "setup" | "synthesis";

const DOMAINS = [
  { id: "frontend", label: "Frontend", icon: Layout, color: "text-blue-400" },
  { id: "backend", label: "Backend", icon: Database, color: "text-emerald-400" },
  { id: "fullstack", label: "Fullstack", icon: Cpu, color: "text-violet-400" },
  { id: "ai", label: "AI / ML", icon: Sparkles, color: "text-amber-400" },
  { id: "devops", label: "DevOps", icon: Zap, color: "text-orange-400" },
  { id: "cyber", label: "Cybersecurity", icon: Shield, color: "text-red-400" },
];

const EXPERIENCE_LEVELS = [
  { id: "ENTRY", label: "Entry Level", desc: "0-2 years" },
  { id: "MID", label: "Mid Level", desc: "3-5 years" },
  { id: "SENIOR", label: "Senior", desc: "6-10 years" },
  { id: "LEAD", label: "Lead / Staff", desc: "10+ years" },
];

export function Onboarding() {
  const [step, setStep] = useState<Step>("setup");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [role, setRole] = useState("");
  const [exp, setExp] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisLogs, setSynthesisLogs] = useState<string[]>([]);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user && (session.user as any).githubUsername) {
      setGithub((session.user as any).githubUsername);
    }
  }, [session]);

  const startSynthesis = async () => {
    setStep("synthesis");
    setIsSynthesizing(true);
    
    const logs = [
      "Connecting to GitHub Graph API...",
      "Analyzing repository commit density...",
      "Extracting engineering signals from source...",
      "Detecting production deployment patterns...",
      "Mapping technology substrate...",
      "Synthesizing professional identity...",
      "Optimizing for recruiter scan flow...",
      "Generating ATS-optimized CV structure..."
    ];

    for (let i = 0; i < logs.length; i++) {
      setSynthesisLogs(prev => [...prev, logs[i]]);
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));
    }

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github, linkedin, role, exp }),
      });
      
      if (!res.ok) throw new Error("Synthesis failed");
      
      // Final log
      setSynthesisLogs(prev => [...prev, "Identity synthesis complete."]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex items-center justify-center overflow-hidden font-outfit">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/5 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-4xl px-6 my-8"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/5">
                <Rocket className="text-blue-500 w-8 h-8 animate-pulse" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
                Setup your Resummit Profile
              </h1>
              <p className="text-neutral-500 text-sm">
                We've connected your account. Fill in your professional details to initiate analysis.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Identity Info */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    Identity Sources
                  </h3>

                  <div className="space-y-5">
                    {/* GitHub Username input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[2px] text-neutral-500 block">GitHub Profile</label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-blue-500 transition-colors">
                          <GitBranch className="w-5 h-5" />
                        </div>
                        <input
                          required
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="github_username"
                          className="w-full bg-neutral-950 border border-white/5 focus:border-blue-500/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-neutral-600 font-mono"
                        />
                      </div>
                    </div>

                    {/* LinkedIn input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[2px] text-neutral-500 block">LinkedIn Profile (Optional)</label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-blue-500 transition-colors">
                          <LinkIcon className="w-5 h-5" />
                        </div>
                        <input
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full bg-neutral-950 border border-white/5 focus:border-blue-500/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-neutral-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Focus Areas */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Career Specialization
                  </h3>

                  <div className="space-y-6">
                    {/* Domain Grid */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[2px] text-neutral-500 mb-3 block">Target Domain</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {DOMAINS.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setRole(d.label)}
                            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-[100px] ${
                              role === d.label 
                                ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/5" 
                                : "bg-neutral-950 border-white/5 hover:border-white/10"
                            }`}
                          >
                            <d.icon className={`w-5 h-5 ${d.color}`} />
                            <span className="text-xs font-bold block mt-2 text-white">{d.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Experience Level Grid */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[2px] text-neutral-500 mb-3 block">Seniority</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {EXPERIENCE_LEVELS.map((level) => (
                          <button
                            key={level.id}
                            type="button"
                            onClick={() => setExp(level.id)}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              exp === level.id 
                                ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/5" 
                                : "bg-neutral-950 border-white/5 hover:border-white/10"
                            }`}
                          >
                            <span className="text-xs font-bold block mb-1 text-white">{level.label}</span>
                            <span className="text-[9px] text-neutral-500 uppercase tracking-widest">{level.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="mt-8 text-center">
              <button
                type="button"
                disabled={!github || !role || !exp}
                onClick={startSynthesis}
                className="group w-full max-w-md py-5 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:hover:bg-white rounded-2xl font-bold text-base transition-all shadow-xl shadow-white/5 active:scale-[0.98] inline-flex items-center justify-center gap-3"
              >
                Analyze and Generate Resume
                <Zap className="w-4 h-4 text-black shrink-0" />
              </button>
            </div>
          </motion.div>
        )}

        {step === "synthesis" && (
          <motion.div
            key="synthesis"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl px-6 text-center"
          >
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
              <div className="relative w-32 h-32 bg-neutral-900 border border-blue-500/30 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                 <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-8 font-outfit">Synthesizing Profile</h2>
            
            <div className="space-y-4 max-w-md mx-auto h-[240px] flex flex-col justify-end overflow-hidden">
               <AnimatePresence initial={false}>
                  {synthesisLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 text-left"
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${i === synthesisLogs.length - 1 ? 'text-blue-500' : 'text-emerald-500'}`} />
                      <span className={`text-sm font-medium ${i === synthesisLogs.length - 1 ? 'text-white' : 'text-neutral-500'}`}>
                        {log}
                      </span>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
