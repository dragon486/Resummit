import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

// System font fallbacks to bypass Google Font network build blockers
const inter = { variable: 'font-sans' };
const outfit = { variable: 'font-display' };

export const metadata: Metadata = {
  title: "Resummit — GitHub Resume Intelligence",
  description: "Transform your GitHub projects into professional, ATS-optimized resume bullets in seconds.",
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
