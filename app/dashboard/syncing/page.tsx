"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle2, GitBranch, Sparkles, Brain } from "lucide-react";

type SyncStep = "FETCHING" | "SELECTING" | "GENERATING" | "SAVING" | "COMPLETED" | "ERROR";

export default function SyncingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<SyncStep>("FETCHING");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    async function runSync() {
      try {
        setStep("FETCHING");
        
        // We use the new consolidated scan API
        const response = await fetch("/api/sync/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: (session?.user as any)?.accessToken })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Sync failed at engine level");
        }

        const data = await response.json();
        
        if (data.skipped) {
          setStep("COMPLETED"); // Already synced recently
        } else {
          setStep("COMPLETED");
        }

        setTimeout(() => router.push("/dashboard"), 1500);
      } catch (err: any) {
        setStep("ERROR");
        setError(err.message || "An unexpected error occurred during synchronization.");
      }
    }

    runSync();
  }, [session, router]);

  return (
    <div className="dark-page min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md">
        {/* Animated Progress Ring */}
        <div className="relative w-32 h-32 mx-auto mb-12">
          <div className="absolute inset-0 border-4 border-neutral-900 rounded-full" />
          <div className={`absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin ${step === "COMPLETED" || step === "ERROR" ? "hidden" : ""}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            {step === "FETCHING" && <GitBranch className="w-10 h-10 text-neutral-400" />}
            {step === "SELECTING" && <Sparkles className="w-10 h-10 text-blue-400" />}
            {step === "GENERATING" && <Brain className="w-10 h-10 text-sky-400" />}
            {step === "SAVING" && <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />}
            {step === "COMPLETED" && <CheckCircle2 className="w-10 h-10 text-green-500" />}
            {step === "ERROR" && <div className="text-red-500 font-bold text-2xl">!</div>}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {step === "FETCHING" && "Connecting to GitHub..."}
          {step === "SELECTING" && "Picking your best work..."}
          {step === "GENERATING" && "AI is writing your resume..."}
          {step === "SAVING" && "Saving your resume..."}
          {step === "COMPLETED" && "Everything is ready!"}
          {step === "ERROR" && "Sync Failed"}
        </h2>

        <p className="text-neutral-500">
          {step === "FETCHING" && "Scrubbing repositories for technical data."}
          {step === "SELECTING" && "Analyzing stars and activity metrics."}
          {step === "GENERATING" && "Generating STAR-method bullets for ATS."}
          {step === "SAVING" && "Finalizing your resume sync."}
          {step === "COMPLETED" && "Redirecting to your editor..."}
          {step === "ERROR" && error}
        </p>

        {step === "ERROR" && (
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors border border-neutral-800"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
