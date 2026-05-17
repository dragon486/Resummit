import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

// System font fallbacks to bypass Google Font network build blockers
const inter = { variable: 'font-sans' };
const outfit = { variable: 'font-display' };

export const metadata: Metadata = {
  title: "Sclade AI | Auto-Updating AI CV Engine",
  description: "Transform your GitHub projects into professional, ATS-optimized resume bullets in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body className="font-sans min-h-full bg-neutral-950 text-white flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
