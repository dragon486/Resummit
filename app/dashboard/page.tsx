import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";
import { LayoutDashboard, FileText, Settings, Rocket, ArrowRight, Bell, User, Cpu, Target, Zap, Shield, Sparkles, BarChart3, Activity } from "lucide-react";
import Link from "next/link";
import { SmartUpdateCenter } from "@/components/dashboard/SmartUpdateCenter";
import { DashboardControls } from "@/components/dashboard/DashboardControls";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { EngineeringSignals } from "@/lib/server/githubIntelligence";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Load user data with new schema
  let dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      suggestions: {
        where: { status: "PENDING" },
        orderBy: { priority: "desc" },
      },
      resumes: {
        include: {
          versions: {
            where: { isMain: true },
            take: 1,
          },
        },
      },
      githubData: true,
    }
  });

  // Self-healing: if ID lookup failed but we have email, try email lookup
  if (!dbUser && session.user.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        suggestions: { where: { status: "PENDING" }, orderBy: { priority: "desc" } },
        resumes: { include: { versions: { where: { isMain: true }, take: 1 } } },
        githubData: true,
      }
    });
  }

  if (!dbUser) {
    redirect("/api/auth/signout");
  }

  const mainResume = dbUser.resumes[0];
  const mainVersion = mainResume?.versions[0];
  const signals = (dbUser.githubData?.signals as any) as EngineeringSignals || null;
  
  // Check if onboarding is needed
  const showOnboarding = (!dbUser.githubData || !signals) && dbUser.resumes.length === 0;

  if (showOnboarding) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30 font-outfit">
      {/* Premium Gradient Header Background */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-600/[0.03] to-transparent pointer-events-none" />

      {/* Top Nav */}
      <nav className="relative z-50 px-8 py-5 flex items-center justify-between border-b border-white/[0.03] bg-neutral-950/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">SCLADE</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
             <Link href="/dashboard" className="text-white border-b-2 border-blue-500 pb-1 -mb-[22px]">Dashboard</Link>
             <Link href="/editor" className="hover:text-white transition-colors">Editor</Link>
          </div>
        </div>
        <DashboardControls user={dbUser} />
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto p-8 md:p-12">
        <header className="mb-12">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] uppercase font-bold tracking-widest mb-4">
             AI Active • Claude-3.5
           </div>
           <h1 className="text-4xl font-bold tracking-tight flex items-center gap-4">
             Welcome back, {dbUser.name?.split(' ')[0]}
           </h1>
           <p className="text-neutral-500 mt-2 font-light text-lg">Orchestrate your professional impact and career logic.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* Left/Middle Column - Suggestions & Activity */}
           <div className="lg:col-span-8 space-y-10">
              
               {/* Resume Health Card */}
               <div className="glass-panel p-8 rounded-[2.5rem] bg-neutral-900/40 border border-white/[0.05] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700" />
                  
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                           <Target className="w-3.5 h-3.5 text-blue-500" />
                           <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Resume Performance</h3>
                        </div>
                        <div className="flex items-baseline gap-3">
                           <span className="text-6xl font-bold tracking-tighter">{mainVersion?.atsScore || 0}</span>
                           <span className="text-neutral-500 font-medium text-xl">/100</span>
                        </div>
                        <p className="text-neutral-400 mt-4 max-w-md text-sm leading-relaxed font-medium">
                           Your technical identity is <strong>{mainVersion?.atsScore ? (mainVersion.atsScore > 85 ? "Market-Ready" : "Optimizing") : "Indexing"}</strong>. 
                           {mainVersion?.atsScore && mainVersion.atsScore < 85 && " AI suggests strengthening project metrics."}
                        </p>
                     </div>
                     
                     <div className="w-full md:w-auto">
                        <Link href="/editor" className="flex items-center gap-3 px-8 py-5 bg-white text-black hover:bg-neutral-200 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-white/5 active:scale-95 group/btn">
                           Open OS Editor
                           <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                     </div>
                  </div>
               </div>

               {/* Engineering DNA Core */}
               {signals && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-8 rounded-[2.5rem] bg-neutral-900/40 border border-white/[0.05] relative overflow-hidden group">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-2">
                             <Cpu className="w-4 h-4 text-violet-400" />
                             <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Engineering DNA</h3>
                          </div>
                          <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded text-[9px] font-bold uppercase tracking-widest">Verified</span>
                       </div>
                       
                       <div className="space-y-6">
                          <div>
                             <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2 text-neutral-400">
                                <span>Stack Confidence</span>
                                <span>{signals.stackConfidence}%</span>
                             </div>
                             <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-violet-500 rounded-full transition-all duration-1000" 
                                  style={{ width: `${signals.stackConfidence || 0}%` }} 
                                />
                             </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                             {(signals.topSkills || []).slice(0, 5).map((s, i) => (
                               <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-neutral-300">
                                 {s.name}
                               </span>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2.5rem] bg-neutral-900/40 border border-white/[0.05] relative overflow-hidden group">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-2">
                             <Activity className="w-4 h-4 text-emerald-400" />
                             <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Recruiter Perspective</h3>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase tracking-widest">Live</span>
                       </div>
                       
                       <div className="space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex flex-col">
                                <span className="text-2xl font-bold">{signals.recruiterReadability || 0}%</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Scan Readability</span>
                             </div>
                             <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center">
                                <Target className="w-5 h-5 text-emerald-500" />
                             </div>
                          </div>

                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                             <p className="text-[10px] text-emerald-200/60 leading-relaxed font-medium">
                                System detects strong <strong>{signals.strongestDomain || "Software Engineering"}</strong> domain expertise. 
                                Commit density is <strong>{signals.commitDensity || "Consistent"}</strong>.
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               <SmartUpdateCenter 
                 initialSuggestions={dbUser.suggestions} 
                 lastSyncAt={dbUser.githubData?.lastSyncedAt?.toISOString() || null}
                 accessToken={(session.user as any).accessToken}
               />
           </div>

           {/* Right Column - Stats & Links */}
           <div className="lg:col-span-4 space-y-8">
              <div className="glass-panel p-8 rounded-[2.5rem] bg-neutral-900/40 border border-white/[0.05]">
                 <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-6">Quick Operations</h3>
                 <div className="space-y-4">
                    <Link href="/editor" className="group flex items-center justify-between p-5 bg-neutral-900/60 rounded-3xl border border-white/[0.03] hover:border-blue-500/30 hover:bg-neutral-800/80 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold uppercase tracking-wide">Resume Editor</span>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                               {mainResume?.updatedAt ? `Updated ${new Date(mainResume.updatedAt).toLocaleDateString()}` : "Not started"}
                            </span>
                          </div>
                       </div>
                       <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/dashboard/syncing" className="group flex items-center justify-between p-5 bg-neutral-900/60 rounded-3xl border border-white/[0.03] hover:border-violet-500/30 hover:bg-neutral-800/80 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                            <LayoutDashboard className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold uppercase tracking-wide">Import from GitHub</span>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                               {dbUser.githubData ? "Repositories synced" : "Connect GitHub"}
                            </span>
                          </div>
                       </div>
                       <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </div>
              </div>

              <div className="relative overflow-hidden group p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl shadow-blue-500/20">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all" />
                 <h3 className="font-bold text-2xl mb-2">Sclade Pro</h3>
                 <p className="text-blue-100 text-sm mb-8 leading-relaxed opacity-80">Unlock real-time ATS monitoring and multi-version resume management.</p>
                 <button className="w-full py-4 bg-white text-blue-700 font-bold rounded-2xl text-sm hover:translate-y-[-2px] transition-all shadow-xl active:scale-95">
                    Upgrade Now
                 </button>
              </div>

              <div className="p-4">
                 <Link href="/api/auth/signout" className="block w-full py-3 text-center text-red-500/60 hover:text-red-500 text-xs font-bold transition-all border border-red-500/10 rounded-2xl">
                    Sign Out Terminal
                 </Link>
              </div>
           </div>

        </div>
      </main>
    </div>
  );
}
