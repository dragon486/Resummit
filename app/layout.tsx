import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

// System font fallbacks to bypass Google Font network build blockers
const inter = { variable: 'font-sans' };
const outfit = { variable: 'font-display' };

export const metadata: Metadata = {
  title: "Resummit — GitHub Resume Intelligence by Adel Muhammed",
  description: "Built from your work. Not from templates. Resummit, created by Adel Muhammed, turns real engineering work into professional resumes developers can confidently share with recruiters and hiring teams.",
  keywords: [
    "GitHub Resume Builder",
    "Developer Resume Intelligence",
    "ATS Optimized Resume",
    "Adel Muhammed",
    "Resummit",
    "Software Engineer Resume",
    "Tech CV Builder"
  ],
  authors: [{ name: "Adel Muhammed", url: "https://github.com/dragon486" }],
  creator: "Adel Muhammed",
  metadataBase: new URL("https://resummit.com"),
  openGraph: {
    title: "Resummit — GitHub Resume Intelligence by Adel Muhammed",
    description: "Built from your work. Not from templates. Resummit turns real engineering work into professional resumes developers can confidently share with recruiters and hiring teams.",
    siteName: "Resummit",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resummit — GitHub Resume Intelligence by Adel Muhammed",
    description: "Built from your work. Not from templates. Resummit turns real engineering work into professional resumes developers can confidently share with recruiters and hiring teams.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('sclade-theme');
                if (savedTheme === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="font-sans min-h-full bg-[var(--sclade-bg)] text-[var(--sclade-text-primary)] flex flex-col transition-colors duration-200">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
