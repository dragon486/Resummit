import type { Metadata } from "next";
import { signIn } from "@/auth";
import { GitBranch, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In to Resummit — Access Your Engineering Dashboard",
  description: "Securely log into Resummit, the ultimate GitHub resume intelligence tool developed by Adel Muhammed. Sync your real projects, analyze ATS scores, and generate premium resumes.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 text-center">
        {/* Logo Icon & Wordmark */}
        <div className="flex flex-col items-center mb-12 select-none">
          <div className="logo scale-125">
            <svg viewBox="0 0 32 32" className="logo-icon-svg !w-12 !h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 6C7 4.34315 8.34315 3 10 3H19L25 9V26C25 27.6569 23.6569 29 22 29H10C8.34315 29 7 27.6569 7 26V6Z" className="logo-doc-body" />
              <path d="M19 3V9H25L19 3Z" className="logo-doc-fold" />
              <path d="M11 13H17M11 17H21M11 21H18M11 25H20" className="logo-doc-lines" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 8.5L25 3.5" className="logo-flag-pole" strokeWidth="2" strokeLinecap="round" />
              <path d="M25 3.5L27 6.5L23.5 5.5Z" className="logo-flag-banner" />
            </svg>
            <div className="logo-text-group">
              <div className="logo-wordmark !text-2xl text-white">RESUMMIT</div>
              <div className="logo-tagline !text-[0.65rem] text-neutral-500">YOUR COMMITS. YOUR CAREER.</div>
            </div>
          </div>
        </div>
        <p className="text-neutral-400 text-lg mb-12">
          Transform your GitHub projects into professional, ATS-optimized resume bullets in seconds.
        </p>

        <div className="space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-[#24292F] hover:bg-[#24292F]/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-xl"
            >
              <GitBranch className="w-5 h-5" />
              Continue with GitHub
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-950 font-semibold py-4 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        <p className="mt-8 text-neutral-500 text-sm">
          No credit card required. Free early access.
        </p>
      </div>

      {/* Subtle Bottom Decoration */}
      <div className="absolute bottom-8 text-neutral-600 text-[10px] uppercase tracking-[0.2em] font-medium">
        Designed for High-Impact Engineers
      </div>
    </div>
  );
}
