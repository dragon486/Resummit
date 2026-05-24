"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Brain, FileDown, KeyRound, Terminal, Cpu, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

export function LandingClient({ hasSession }: { hasSession?: boolean }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [resumeScale, setResumeScale] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const resumeContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !resumeContainerRef.current) return;

    const updateScale = () => {
      if (!resumeContainerRef.current) return;
      const containerWidth = resumeContainerRef.current.getBoundingClientRect().width;
      const availableWidth = containerWidth - 20;
      const newScale = Math.min(1, Math.max(0.1, availableWidth / 794));
      setResumeScale(newScale);
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    if (resumeContainerRef.current) {
      observer.observe(resumeContainerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Theme toggle logic initialization
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("resummit-theme") as "dark" | "light";
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      root.setAttribute("data-theme", savedTheme);
      if (savedTheme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }
    } else {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
    }

    // Scroll reveal observer
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.14 }
    );

    reveals.forEach((el) => observer.observe(el));

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    root.setAttribute("data-theme", next);
    localStorage.setItem("resummit-theme", next);
    localStorage.setItem("sclade-theme", next);
    if (next === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  };

  return (
    <>
      {/* Load Google Fonts directly in React */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Exact style block from your HTML */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --radius: 24px;
          --transition: 0.35s cubic-bezier(.22,.61,.36,1);
          --max-width: 100%;
        }

        [data-theme="dark"] {
          --bg: #060816;
          --surface: #0f172a;
          --surface-2: #131d35;
          --text: #f8fafc;
          --muted: #94a3b8;
          --border: rgba(255,255,255,0.08);
          --primary: #4f8cff;
          --shadow: rgba(0,0,0,0.4);
          --nav: rgba(6,8,22,0.72);
          --logo-doc-body: #172554;
          --logo-doc-fold: #1d4ed8;
          --logo-doc-lines: #3b82f6;
          --logo-flag-pole: #60a5fa;
          --logo-flag-banner: #60a5fa;
          --logo-text: #ffffff;
          --logo-tagline: #64748b;
        }

        [data-theme="light"] {
          --bg: #ffffff;
          --surface: #ffffff;
          --surface-2: #f1f5f9;
          --text: #0f172a;
          --muted: #475569;
          --border: rgba(15,23,42,0.08);
          --primary: #2563eb;
          --shadow: rgba(15,23,42,0.08);
          --nav: rgba(255,255,255,0.82);
          --logo-doc-body: #dbeafe;
          --logo-doc-fold: #bfdbfe;
          --logo-doc-lines: #93c5fd;
          --logo-flag-pole: #2563eb;
          --logo-flag-banner: #2563eb;
          --logo-text: #0f172a;
          --logo-tagline: #64748b;
        }

        .landing-body * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif !important;
        }

        .landing-body {
          font-family: 'Inter', sans-serif !important;
          background: var(--bg);
          color: var(--text);
          transition: background var(--transition), color var(--transition);
          line-height: 1.6;
          overflow-x: hidden;
          width: 100%;
          min-height: 100vh;
        }

        .landing-body h1,
        .landing-body h2,
        .landing-body .title,
        .landing-body .contact h2 {
          font-weight: 800 !important;
        }

        .landing-body h3,
        .landing-body h4,
        .landing-body .step h4,
        .landing-body .card h3,
        .landing-body .footer-column h4,
        .landing-body strong,
        .landing-body b {
          font-weight: 700 !important;
        }

        .landing-body .container {
          width: min(92%, var(--max-width, 100%)) !important;
          max-width: var(--max-width, 100%) !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        .landing-body .code, .landing-body .code * {
          font-family: monospace !important;
        }

        .landing-body nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 100;
          background: var(--nav);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border);
        }

        .landing-body .nav-inner {
          height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .landing-body .logo span {
          color: var(--primary);
        }

        .landing-body .nav-links {
          display: flex;
          gap: 28px;
        }

        .landing-body .nav-links a {
          text-decoration: none;
          color: var(--muted);
          font-weight: 500;
          transition: 0.3s;
        }

        .landing-body .nav-links a:hover {
          color: var(--text);
        }

        .landing-body .nav-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .landing-body .theme-switch {
          position: relative;
          width: 58px;
          height: 32px;
          border-radius: 9999px;
          border: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.05);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        [data-theme="dark"] .landing-body .theme-switch {
          background: rgba(255, 255, 255, 0.05);
        }

        .landing-body .theme-switch:hover {
          border-color: var(--primary);
          box-shadow: 0 0 12px rgba(79, 140, 255, 0.15);
        }

        .landing-body .theme-switch-indicator {
          position: absolute;
          left: 3px;
          top: 3.5px;
          width: 23px;
          height: 23px;
          border-radius: 50%;
          background: var(--text);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s;
          z-index: 1;
        }

        .landing-body .theme-switch-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: opacity 0.25s ease, color 0.25s ease;
          color: var(--text);
        }
        
        [data-theme="light"] .landing-body .theme-switch .sun-icon {
          color: #d97706;
        }
        
        [data-theme="dark"] .landing-body .theme-switch .moon-icon {
          color: #60a5fa;
        }

        .landing-body .primary-btn {
          padding: 13px 22px;
          border: none;
          border-radius: 16px;
          background: var(--text);
          color: var(--bg);
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .landing-body .primary-btn:hover {
          transform: translateY(-2px);
        }

        .landing-body .logout-btn {
          padding: 13px 22px;
          border-radius: 16px;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: rgba(239, 68, 68, 0.85);
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .landing-body .logout-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.4);
          color: rgb(239, 68, 68);
          transform: translateY(-2px);
        }

        .landing-body .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: 100px;
          padding-bottom: 100px;
          position: relative;
          overflow: hidden;
        }

        .landing-body .glow {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79, 140, 255, 0.16), transparent 70%);
          top: -220px;
          right: -220px;
          pointer-events: none;
        }

        .landing-body .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 70px;
          align-items: center;
        }

        .landing-body .badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface);
          margin-bottom: 26px;
          color: var(--primary);
          font-size: 0.88rem;
          font-weight: 700;
        }

        .landing-body .dot {
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
        }

        .landing-body .hero h1 {
          font-size: clamp(3.8rem, 8vw, 11rem) !important;
          line-height: 0.92 !important;
          letter-spacing: -0.08em !important;
          margin-bottom: 24px;
          max-width: 1000px !important;
        }

        .landing-body .hero p {
          max-width: 750px !important;
          font-size: clamp(1.08rem, 1.6vw, 1.4rem) !important;
          color: var(--muted);
          margin-bottom: 34px;
        }

        .landing-body .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .landing-body .secondary-btn {
          padding: 13px 22px;
          border-radius: 16px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .landing-body .preview {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 30px 80px var(--shadow);
        }

        .resume-preview-wrapper {
          position: relative;
          overflow: hidden;
          width: 794px;
          height: 1123px;
          margin: 0 auto;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 4px;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease;
        }
        .resume-preview-wrapper:hover {
          transform: translateY(-10px) scale(1.005) !important;
          box-shadow: 0 35px 80px rgba(0, 0, 0, 0.35) !important;
          border-color: rgba(79, 140, 255, 0.3) !important;
        }

        .resume-preview-sheet {
          width: 794px;
          height: 1123px;
          background: #ffffff;
          color: #0f172a;
          padding: 50px 45px;
          font-family: "'Times New Roman', Georgia, serif";
          text-align: left;
          color-scheme: light;
          box-sizing: border-box;
          position: absolute;
          top: 0;
          left: 0;
          transform-origin: top left;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* Responsive scaling breakpoints */
        @media (max-width: 840px) {
          .resume-preview-wrapper {
            width: 635px;
            height: 898px;
          }
          .resume-preview-sheet {
            transform: scale(0.8);
          }
        }
        @media (max-width: 680px) {
          .resume-preview-wrapper {
            width: 476px;
            height: 673px;
          }
          .resume-preview-sheet {
            transform: scale(0.6);
          }
        }
        @media (max-width: 500px) {
          .resume-preview-wrapper {
            width: 357px;
            height: 505px;
          }
          .resume-preview-sheet {
            transform: scale(0.45);
          }
        }
        @media (max-width: 380px) {
          .resume-preview-wrapper {
            width: 290px;
            height: 410px;
          }
          .resume-preview-sheet {
            transform: scale(0.365);
          }
        }

        .landing-body .preview-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
        }

        .landing-body .preview-body {
          padding: 28px;
        }

        .landing-body .code {
          background: #020617;
          color: #dbeafe;
          border-radius: 22px;
          padding: 26px;
          font-family: monospace;
          line-height: 1.9;
          font-size: 0.92rem;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .landing-body .section {
          padding: 120px 0;
        }

        .landing-body .section-head {
          margin-bottom: 58px;
        }

        .landing-body .label {
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--primary);
          font-weight: 700;
          margin-bottom: 16px;
        }

        .landing-body .title {
          font-size: clamp(2.5rem, 5vw, 4.8rem);
          line-height: 0.95;
          letter-spacing: -0.08em;
          margin-bottom: 18px;
        }

        .landing-body .desc {
          max-width: 700px;
          font-size: 1.05rem;
          color: var(--muted);
        }

        .landing-body .cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .landing-body .card {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 34px;
          border-radius: 28px;
          transition: var(--transition);
        }

        .landing-body .card:hover {
          transform: translateY(-6px);
          border-color: rgba(79, 140, 255, 0.3);
        }

        .landing-body .card-icon-wrapper {
          margin-bottom: 22px;
          display: inline-flex;
        }

        .landing-body .card-icon-container {
          width: 62px;
          height: 62px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(79, 140, 255, 0.1), rgba(79, 140, 255, 0.03));
          border: 1px solid rgba(79, 140, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          transition: border-color 0.3s ease, background 0.3s ease;
        }

        .landing-body .card:hover .card-icon-container {
          background: linear-gradient(135deg, rgba(79, 140, 255, 0.2), rgba(79, 140, 255, 0.05));
          border-color: rgba(79, 140, 255, 0.4);
          box-shadow: 0 0 20px rgba(79, 140, 255, 0.15);
        }

        .landing-body .icon-style {
          width: 26px;
          height: 26px;
          stroke-width: 2px;
        }

        .landing-body .card h3 {
          margin-bottom: 12px;
          font-size: 1.22rem;
        }

        .landing-body .card p {
          color: var(--muted);
        }

        .landing-body .workflow {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 28px;
          position: relative;
        }

        .landing-body .workflow-step-card {
          background: rgba(15, 23, 42, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 24px;
          padding: 30px;
          position: relative;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .landing-body .workflow-step-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--primary), rgba(79, 140, 255, 0.1));
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .landing-body .workflow-step-card:hover {
          transform: translateY(-8px);
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(79, 140, 255, 0.25);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 
                      0 0 30px rgba(79, 140, 255, 0.05);
        }

        .landing-body .workflow-step-card:hover::before {
          opacity: 1;
        }

        .landing-body .step-badge-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .landing-body .step-number {
          font-family: monospace !important;
          font-size: 2.2rem;
          font-weight: 900 !important;
          color: rgba(255, 255, 255, 0.12);
          transition: color 0.3s ease, text-shadow 0.3s ease;
          line-height: 1;
        }

        .landing-body .workflow-step-card:hover .step-number {
          color: var(--primary);
          text-shadow: 0 0 15px rgba(79, 140, 255, 0.6);
        }

        .landing-body .step-icon-container {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          transition: all 0.3s ease;
        }

        .landing-body .workflow-step-card:hover .step-icon-container {
          background: rgba(79, 140, 255, 0.1);
          border-color: rgba(79, 140, 255, 0.35);
          color: var(--primary);
          box-shadow: 0 0 15px rgba(79, 140, 255, 0.15);
        }

        .landing-body .step-icon-container svg {
          width: 20px;
          height: 20px;
          stroke-width: 2px;
        }

        .landing-body .workflow-step-card h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .landing-body .workflow-step-card p {
          font-size: 0.92rem;
          color: var(--muted);
          line-height: 1.6;
        }

        .landing-body .contact {
          background: linear-gradient(135deg, #111827, #1e293b);
          border-radius: 36px;
          padding: 80px;
          border: 1px solid var(--border);
          text-align: center;
        }

        .landing-body .contact h2 {
          font-size: clamp(2.8rem, 5vw, 5rem);
          line-height: 0.92;
          letter-spacing: -0.08em;
          color: white;
          margin-bottom: 20px;
        }

        .landing-body .contact p {
          max-width: 720px;
          margin: auto;
          color: #cbd5e1;
          margin-bottom: 34px;
        }

        .landing-body .contact-links {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .landing-body .contact-links a {
          padding: 14px 20px;
          border-radius: 16px;
          background: white;
          color: #0f172a;
          font-weight: 700;
          text-decoration: none;
          transition: 0.3s;
        }

        .landing-body .contact-links a:hover {
          transform: translateY(-2px);
        }

        .landing-body footer {
          padding: 80px 0 40px 0;
          background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.01) 100%);
          border-top: 1px solid var(--border);
        }

        [data-theme="dark"] .landing-body footer {
          background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.15) 100%);
        }

        .landing-body .footer-grid {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
          align-items: flex-start;
          margin-bottom: 50px;
        }

        .landing-body .footer-left p {
          margin-top: 18px;
          color: var(--muted);
          max-width: 380px;
          font-size: 0.95rem;
          line-height: 1.65;
        }

        .landing-body .footer-links {
          display: flex;
          gap: 80px;
          flex-wrap: wrap;
        }

        .landing-body .footer-column h4 {
          margin-bottom: 20px;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text);
          font-weight: 700;
        }

        .landing-body .footer-column a {
          display: block;
          margin-bottom: 12px;
          color: var(--muted);
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .landing-body .footer-column a:hover {
          color: var(--primary);
          transform: translateX(4px);
        }

        .landing-body .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 30px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
          gap: 20px;
          font-size: 0.85rem;
          color: var(--muted);
        }

        .landing-body .footer-bottom .creator-credit a {
          color: var(--text);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.25s ease;
          border-bottom: 1px dotted rgba(255, 255, 255, 0.2);
        }

        [data-theme="light"] .landing-body .footer-bottom .creator-credit a {
          border-bottom: 1px dotted rgba(0, 0, 0, 0.2);
        }

        .landing-body .footer-bottom .creator-credit a:hover {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .landing-body .reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.9s cubic-bezier(.22,.61,.36,1);
        }

        .landing-body .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        @media(max-width:980px) {
          .landing-body .hero-grid,
          .landing-body .cards,
          .landing-body .workflow {
            grid-template-columns: 1fr;
          }

          .landing-body .nav-links {
            display: none;
          }

          .landing-body .contact {
            padding: 50px 24px;
          }

          .landing-body .hero {
            padding-bottom: 70px;
          }
        }

        @media (max-width: 500px) {
          .landing-body .nav-inner {
            height: 64px;
          }

          .landing-body .logo-icon-svg {
            width: 28px !important;
            height: 28px !important;
          }

          .landing-body .logo-wordmark {
            font-size: 1.15rem !important;
          }

          .landing-body .logo-tagline {
            display: none !important;
          }

          .landing-body .nav-actions {
            gap: 8px !important;
          }

          .landing-body .nav-actions .primary-btn {
            padding: 8px 14px !important;
            font-size: 0.82rem !important;
            border-radius: 12px !important;
          }

          .landing-body .nav-actions .logout-btn {
            display: none !important;
          }

          .landing-body .theme-switch {
            width: 48px !important;
            height: 26px !important;
            padding: 2px !important;
          }

          .landing-body .theme-switch-indicator {
            width: 20px !important;
            height: 20px !important;
            top: 2px !important;
            left: 2px !important;
          }

          .landing-body .theme-switch-icon {
            width: 20px !important;
            height: 20px !important;
          }

          .landing-body .hero-actions {
            flex-direction: column;
            gap: 12px !important;
            width: 100%;
          }

          .landing-body .hero-actions .primary-btn,
          .landing-body .hero-actions .secondary-btn {
            width: 100% !important;
            padding: 14px 20px !important;
            font-size: 1rem !important;
            border-radius: 16px !important;
          }
        }
      ` }} />

      <div className="landing-body">
        {/* Navigation */}
        <nav>
          <div className="container nav-inner">
            <div className="logo">
              <svg viewBox="0 0 32 32" className="logo-icon-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 6C7 4.34315 8.34315 3 10 3H19L25 9V26C25 27.6569 23.6569 29 22 29H10C8.34315 29 7 27.6569 7 26V6Z" className="logo-doc-body" />
                <path d="M19 3V9H25L19 3Z" className="logo-doc-fold" />
                <path d="M11 13H17M11 17H21M11 21H18M11 25H20" className="logo-doc-lines" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 8.5L25 3.5" className="logo-flag-pole" strokeWidth="2" strokeLinecap="round" />
                <path d="M25 3.5L27 6.5L23.5 5.5Z" className="logo-flag-banner" />
              </svg>
              <div className="logo-text-group">
                <div className="logo-wordmark">RESUMMIT</div>
                <div className="logo-tagline">YOUR COMMITS. YOUR CAREER.</div>
              </div>
            </div>

            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#workflow">Workflow</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="nav-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button 
                className="theme-switch" 
                onClick={toggleTheme} 
                aria-label="Toggle theme"
              >
                <span 
                  className="theme-switch-indicator" 
                  style={{ transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(0px)' }} 
                />
                <div className="theme-switch-icon sun-icon" style={{ opacity: theme === 'light' ? 1 : 0.35 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                </div>
                <div className="theme-switch-icon moon-icon" style={{ opacity: theme === 'dark' ? 1 : 0.35 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                </div>
              </button>
              {hasSession ? (
                <>
                  <Link href="/dashboard" className="primary-btn">Go to Dashboard</Link>
                  <Link href="/api/auth/signout" className="logout-btn">Sign Out</Link>
                </>
              ) : (
                <Link href="/login" className="primary-btn">Connect GitHub</Link>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="glow"></div>
          <div className="container hero-grid">
            <div className="reveal">
              <div className="badge">
                <div className="dot"></div>
                GitHub-powered resume intelligence
              </div>

              <h1>Your GitHub already proves your experience.</h1>

              <p>
                Resummit analyzes repositories, commits, technologies, and project structures
                to generate clean, recruiter-ready resumes from the work you already built.
              </p>

              <div className="hero-actions">
                <Link href={hasSession ? "/dashboard" : "/login"} className="primary-btn">{hasSession ? "Go to Dashboard" : "Get Started"}</Link>
                <button 
                  onClick={() => {
                    const element = document.getElementById("preview-section");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="secondary-btn"
                  style={{ cursor: "pointer" }}
                >
                  See Resume Preview
                </button>
              </div>
            </div>

            <div className="preview reveal">
              <div className="preview-header">
                <strong>Live Resume Generation</strong>
                <span style={{ color: "var(--muted)" }}>Real project analysis</span>
              </div>

              <div className="preview-body">
                <div className="code">
                  {"$ resummit analyze github/dragon486\n\n"}
                  {"→ Reading repositories\n"}
                  {"→ Detecting frameworks & languages\n"}
                  {"→ Parsing project structures\n"}
                  {"→ Generating professional resume bullets\n\n"}
                  {"✓ Resume generated successfully\n\n"}
                  {"• Built AI-based sentiment analysis systems\n"}
                  {"• Developed scalable Next.js applications\n"}
                  {"• Integrated Redis caching infrastructure\n"}
                  {"• Automated meeting summarization workflows"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resume Preview Section */}
        <section className="section" id="preview-section" style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <div className="section-head reveal" style={{ textAlign: "center", marginBottom: "40px" }}>
              <div className="label">Interactive Output</div>
              <div className="title" style={{ margin: "0 auto 18px auto" }}>
                Recruiter-Ready.<br />ATS-Optimized.
              </div>
              <div className="desc" style={{ margin: "0 auto" }}>
                Here is a real resume generated from developer commits. It uses professional formatting, clean sections, and is fully optimized for Applicant Tracking Systems (ATS).
              </div>
            </div>

            <div 
              ref={resumeContainerRef}
              className="reveal" 
              style={{ display: "flex", justifyContent: "center", width: "100%", padding: "20px 10px", boxSizing: "border-box" }}
            >
              <div 
                className="resume-preview-wrapper"
                style={isMounted ? {
                  width: `${794 * resumeScale}px`,
                  height: `${1123 * resumeScale}px`,
                } : {}}
              >
                <div 
                  className="resume-preview-sheet"
                  style={isMounted ? {
                    transform: `scale(${resumeScale})`,
                  } : {}}
                >
                  {/* Resume Header */}
                  <div style={{ textAlign: "center", marginBottom: "18px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a", fontFamily: "'Times New Roman', Georgia, serif", letterSpacing: "1px" }}>ALEX DEVELOPER</h2>
                    <div style={{ fontSize: "11px", color: "#475569", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "8px", fontFamily: "'Times New Roman', Georgia, serif" }}>
                      <span>Jalandhar, Punjab, India (Open to Remote)</span>
                      <span>•</span>
                      <span>alex.developer@email.com</span>
                      <span>•</span>
                      <span>+91 98765 43210</span>
                      <span>•</span>
                      <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>github.com/alex-dev</a>
                      <span>•</span>
                      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>linkedin.com/in/alex-developer</a>
                    </div>
                  </div>

                  {/* Technical Summary */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "1.5px solid #0f172a",
                      paddingTop: "5px",
                      marginBottom: "8px",
                      color: "#0f172a",
                      fontFamily: "'Times New Roman', Georgia, serif"
                    }}>
                      TECHNICAL SUMMARY
                    </div>
                    <p style={{ margin: 0, color: "#334155", fontSize: "11px", lineHeight: "1.45", fontFamily: "'Times New Roman', Georgia, serif", textAlign: "justify" }}>
                      Innovative Full-Stack Software Engineer expert in building high-throughput distributed systems and AI capabilities. Proficient in Python, JavaScript, and TypeScript with deep hands-on expertise in Next.js, Node.js, Flask, Prisma, and AWS. Adept at transforming complex data streams and model inference into clean, production-grade applications that drive business value.
                    </p>
                  </div>

                  {/* Technical Skills */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "1.5px solid #0f172a",
                      paddingTop: "5px",
                      marginBottom: "8px",
                      color: "#0f172a",
                      fontFamily: "'Times New Roman', Georgia, serif"
                    }}>
                      TECHNICAL SKILLS
                    </div>
                    <div style={{ margin: 0, color: "#334155", fontSize: "11px", lineHeight: "1.45", fontFamily: "'Times New Roman', Georgia, serif" }}>
                      <div style={{ margin: "2px 0" }}><strong>Languages:</strong> Python, JavaScript, TypeScript</div>
                      <div style={{ margin: "2px 0" }}><strong>Frameworks:</strong> Next.js, Node.js, React, Express, Flask, Django</div>
                      <div style={{ margin: "2px 0" }}><strong>Tools &amp; Platforms:</strong> AWS, PostgreSQL, Git, Docker, TensorFlow, OpenCV, Prisma, Redis, MongoDB, Jupyter, Slack, Bolt.io</div>
                    </div>
                  </div>

                  {/* Professional Experience */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "1.5px solid #0f172a",
                      paddingTop: "5px",
                      marginBottom: "8px",
                      color: "#0f172a",
                      fontFamily: "'Times New Roman', Georgia, serif"
                    }}>
                      PROFESSIONAL EXPERIENCE
                    </div>
                    
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#0f172a", fontSize: "11.5px", marginBottom: "2px", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <span>Software &amp; AI Engineer Intern</span>
                        <span>Mar 2026 — Present</span>
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#475569", fontStyle: "italic", marginBottom: "4px", fontFamily: "'Times New Roman', Georgia, serif" }}>AI Innovation Labs (Remote)</div>
                      <ul style={{ margin: "0 0 0 16px", padding: 0, listStyleType: "disc", color: "#334155", fontSize: "11px", lineHeight: "1.4", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <li style={{ marginBottom: "2px" }}>Designed AI-powered customer support chatbot systems using Python and TensorFlow, increasing support ticket resolution efficiency by 34%.</li>
                        <li style={{ marginBottom: "2px" }}>Implemented classification algorithms in Python for predictive modeling of user engagement patterns, yielding a 12% boost in retention.</li>
                        <li style={{ marginBottom: "2px" }}>Automated functional QA scripts using Selenium WebDriver, cutting regression test duration by 60%.</li>
                      </ul>
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#0f172a", fontSize: "11.5px", marginBottom: "2px", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <span>Junior Software Engineer</span>
                        <span>Jun 2025 — Aug 2025</span>
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#475569", fontStyle: "italic", marginBottom: "4px", fontFamily: "'Times New Roman', Georgia, serif" }}>Oros AI Solutions</div>
                      <ul style={{ margin: "0 0 0 16px", padding: 0, listStyleType: "disc", color: "#334155", fontSize: "11px", lineHeight: "1.4", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <li style={{ marginBottom: "2px" }}>Engineered and scaled a Node.js/Express backend serving 15,000+ active concurrent users with 99.9% uptime, reducing server response latency by 28%.</li>
                        <li style={{ marginBottom: "2px" }}>Built and documented a high-performance RESTful Django API for microservices, increasing data sync speeds by 40%.</li>
                        <li style={{ marginBottom: "2px" }}>Integrated automated integration tests using Pytest and Behave, boosting pipeline code coverage to 92%.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Technical Projects */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "1.5px solid #0f172a",
                      paddingTop: "5px",
                      marginBottom: "8px",
                      color: "#0f172a",
                      fontFamily: "'Times New Roman', Georgia, serif"
                    }}>
                      TECHNICAL PROJECTS
                    </div>
                    
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#0f172a", fontSize: "11.5px", marginBottom: "2px", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <span>Nexio</span>
                        <span style={{ fontStyle: "italic", fontWeight: "normal", color: "#475569", fontSize: "10.5px" }}>Python, TensorFlow</span>
                      </div>
                      <p style={{ margin: "0 0 4px 0", color: "#334155", fontSize: "11px", lineHeight: "1.4", fontFamily: "'Times New Roman', Georgia, serif", textAlign: "justify" }}>
                        Nexio is a high-density, multi-tenant AI ecosystem designed for hyper-growth sales teams, combining professional CRM capabilities with a distributed Neural Persona engine.
                      </p>
                      <ul style={{ margin: "0 0 0 16px", padding: 0, listStyleType: "disc", color: "#334155", fontSize: "11px", lineHeight: "1.4", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <li style={{ marginBottom: "2px" }}>Automated intent scoring using TensorFlow and asynchronous workers results in sub-500ms response times for lead intake.</li>
                        <li style={{ marginBottom: "2px" }}>Distributed idempotency ensured through Redis-backed locking and atomic MongoDB logic, preventing re-execution during retry storms.</li>
                      </ul>
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#0f172a", fontSize: "11.5px", marginBottom: "2px", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <span>Billiq</span>
                        <span style={{ fontStyle: "italic", fontWeight: "normal", color: "#475569", fontSize: "10.5px" }}>Next.js, Prisma</span>
                      </div>
                      <p style={{ margin: "0 0 4px 0", color: "#334155", fontSize: "11px", lineHeight: "1.4", fontFamily: "'Times New Roman', Georgia, serif", textAlign: "justify" }}>
                        Billiq is an intelligent, hardware-free POS and digital billing platform that sends instant receipts via WhatsApp, manages kitchen workflows with a real-time KDS, and uses transaction data for automated customer marketing.
                      </p>
                      <ul style={{ margin: "0 0 0 16px", padding: 0, listStyleType: "disc", color: "#334155", fontSize: "11px", lineHeight: "1.4", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <li style={{ marginBottom: "2px" }}>Utilizes Prisma ORM to manage database schema and Next.js App Router for server-side rendering, enabling seamless integration of real-time analytics with the POS system.</li>
                        <li style={{ marginBottom: "2px" }}>Leverages Server-Sent Events (SSE) to deliver instant receipts via WhatsApp without requiring app installs, improving customer satisfaction and reducing support queries.</li>
                      </ul>
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#0f172a", fontSize: "11.5px", marginBottom: "2px", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <span>Clustering-Crop-Health-Patterns-from-Multispectral-Satellite-Imagery</span>
                        <span style={{ fontStyle: "italic", fontWeight: "normal", color: "#475569", fontSize: "10.5px" }}>Python</span>
                      </div>
                      <p style={{ margin: "0 0 4px 0", color: "#334155", fontSize: "11px", lineHeight: "1.4", fontFamily: "'Times New Roman', Georgia, serif", textAlign: "justify" }}>
                        Automates crop health pattern discovery from multispectral satellite imagery using unsupervised machine learning, enabling data-driven insights for agricultural decision-making.
                      </p>
                      <ul style={{ margin: "0 0 0 16px", padding: 0, listStyleType: "disc", color: "#334155", fontSize: "11px", lineHeight: "1.4", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <li style={{ marginBottom: "2px" }}>Applies three clustering algorithms (K-Means, HDBSCAN, GMM) to a seven-index spectral feature space in Python.</li>
                        <li style={{ marginBottom: "2px" }}>Generates actionable heat maps and yield predictions without requiring labelled training data.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Education */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "1.5px solid #0f172a",
                      paddingTop: "5px",
                      marginBottom: "8px",
                      color: "#0f172a",
                      fontFamily: "'Times New Roman', Georgia, serif"
                    }}>
                      EDUCATION
                    </div>
                    
                    <div style={{ marginBottom: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#0f172a", fontSize: "11.5px", marginBottom: "2px", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <span>B.Tech Computer Science AI &amp; ML</span>
                        <span>Expected 2027</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#475569", fontStyle: "italic", fontFamily: "'Times New Roman', Georgia, serif" }}>LPU Technical Academy</div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#0f172a", fontSize: "11.5px", marginBottom: "2px", fontFamily: "'Times New Roman', Georgia, serif" }}>
                        <span>High School Graduation (Science / PCM Stream)</span>
                        <span>Jun 2021 — May 2023</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#475569", fontStyle: "italic", fontFamily: "'Times New Roman', Georgia, serif" }}>Sarvodaya Central Academy • CBSE Board • Percentage: 75%</div>
                    </div>
                  </div>

                  {/* Achievements & Certifications */}
                  <div>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderTop: "1.5px solid #0f172a",
                      paddingTop: "5px",
                      marginBottom: "8px",
                      color: "#0f172a",
                      fontFamily: "'Times New Roman', Georgia, serif"
                    }}>
                      ACHIEVEMENTS &amp; CERTIFICATIONS
                    </div>
                    <div style={{ fontSize: "11px", color: "#334155", lineHeight: "1.45", fontFamily: "'Times New Roman', Georgia, serif" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span>• Cloud Integration Specialist Certification <a href="https://credly.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "#1a0dab", fontWeight: "bold", cursor: "pointer" }}>[Link]</a></span>
                        <span style={{ fontWeight: "bold" }}>Dec 2025</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span>• freeCodeCamp Responsive Web Design Developer Certification <a href="https://freecodecamp.org" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "#1a0dab", fontWeight: "bold", cursor: "pointer" }}>[Link]</a></span>
                        <span style={{ fontWeight: "bold" }}>2025</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span>• Open-Source Hackathon Participation Certificate <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "#1a0dab", fontWeight: "bold", cursor: "pointer" }}>[Link]</a></span>
                        <span style={{ fontWeight: "bold" }}>2025</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span>• Computational Systems &amp; Finite Automata Excellence <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "#1a0dab", fontWeight: "bold", cursor: "pointer" }}>[Link]</a></span>
                        <span style={{ fontWeight: "bold" }}>2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section" id="features">
          <div className="container">
            <div className="section-head reveal">
              <div className="label">Features</div>
              <div className="title">
                Built for developers,<br />
                not generic templates.
              </div>
              <div className="desc">
                Professional resume generation powered directly by your repositories,
                projects, and engineering work.
              </div>
            </div>

            <div className="cards">
              <motion.div className="card reveal" whileHover="hover">
                <div className="card-icon-wrapper">
                  <motion.div 
                    className="card-icon-container"
                    variants={{
                      hover: { scale: 1.15, rotate: 8 }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  >
                    <GitBranch className="icon-style" />
                  </motion.div>
                </div>
                <h3>GitHub Sync</h3>
                <p>
                  Secure OAuth integration that reads repositories, commits,
                  README files, and technologies automatically.
                </p>
              </motion.div>

              <motion.div className="card reveal" whileHover="hover">
                <div className="card-icon-wrapper">
                  <motion.div 
                    className="card-icon-container"
                    variants={{
                      hover: { scale: 1.15, rotate: 8 }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  >
                    <Brain className="icon-style" />
                  </motion.div>
                </div>
                <h3>AI Resume Writing</h3>
                <p>
                  Generate recruiter-friendly resume bullets from the systems,
                  projects, and workflows you've actually built.
                </p>
              </motion.div>

              <motion.div className="card reveal" whileHover="hover">
                <div className="card-icon-wrapper">
                  <motion.div 
                    className="card-icon-container"
                    variants={{
                      hover: { scale: 1.15, rotate: 8 }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  >
                    <FileDown className="icon-style" />
                  </motion.div>
                </div>
                <h3>PDF Export</h3>
                <p>
                  Export clean, professional resumes with consistent formatting
                  and ATS-friendly layouts.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="section" id="workflow">
          <div className="container">
            <div className="section-head reveal">
              <div className="label">Workflow</div>
              <div className="title">
                Fast workflow.<br />
                Minimal friction.
              </div>
            </div>

            <div className="workflow">
              <motion.div 
                className="workflow-step-card reveal" 
                whileHover="hover"
              >
                <div className="step-badge-row">
                  <span className="step-number">01</span>
                  <motion.div 
                    className="step-icon-container"
                    variants={{ hover: { scale: 1.1, rotate: 360 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <KeyRound />
                  </motion.div>
                </div>
                <h3>Secure Connect</h3>
                <p>Connect GitHub securely using OAuth authentication.</p>
              </motion.div>

              <motion.div 
                className="workflow-step-card reveal" 
                whileHover="hover"
              >
                <div className="step-badge-row">
                  <span className="step-number">02</span>
                  <motion.div 
                    className="step-icon-container"
                    variants={{ hover: { scale: 1.1, y: -2 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <Terminal />
                  </motion.div>
                </div>
                <h3>Smart Analysis</h3>
                <p>Repositories and technologies are analyzed automatically.</p>
              </motion.div>

              <motion.div 
                className="workflow-step-card reveal" 
                whileHover="hover"
              >
                <div className="step-badge-row">
                  <span className="step-number">03</span>
                  <motion.div 
                    className="step-icon-container"
                    variants={{ hover: { scale: 1.1, rotate: 15 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <Cpu />
                  </motion.div>
                </div>
                <h3>AI Synthesis</h3>
                <p>AI generates structured professional resume content.</p>
              </motion.div>

              <motion.div 
                className="workflow-step-card reveal" 
                whileHover="hover"
              >
                <div className="step-badge-row">
                  <span className="step-number">04</span>
                  <motion.div 
                    className="step-icon-container"
                    variants={{ hover: { scale: 1.1, y: 3 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <FileCheck />
                  </motion.div>
                </div>
                <h3>Instant Export</h3>
                <p>Export a polished PDF ready for recruiters and applications.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact/CTA Section */}
        <section className="section" id="contact">
          <div className="container">
            <div className="contact reveal">
              <h2>
                Built from your work.<br />
                Not from templates.
              </h2>
              <p>
                Resummit turns real engineering work into professional resumes developers can confidently share with recruiters and hiring teams. Designed, developed, and maintained by <strong>Adel Muhammed</strong>.
              </p>
              <div className="contact-links">
                <a href="mailto:adelmuhammed786@gmail.com">Contact</a>
                <a href="https://github.com/dragon486" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://www.linkedin.com/in/adel-muhammed-49136a282/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <div className="container footer-grid">
            <div className="footer-left">
              <div className="logo">
                <svg viewBox="0 0 32 32" className="logo-icon-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 6C7 4.34315 8.34315 3 10 3H19L25 9V26C25 27.6569 23.6569 29 22 29H10C8.34315 29 7 27.6569 7 26V6Z" className="logo-doc-body" />
                  <path d="M19 3V9H25L19 3Z" className="logo-doc-fold" />
                  <path d="M11 13H17M11 17H21M11 21H18M11 25H20" className="logo-doc-lines" strokeWidth="2" strokeLinecap="round" />
                  <path d="M20 8.5L25 3.5" className="logo-flag-pole" strokeWidth="2" strokeLinecap="round" />
                  <path d="M25 3.5L27 6.5L23.5 5.5Z" className="logo-flag-banner" />
                </svg>
                <div className="logo-text-group">
                  <div className="logo-wordmark">RESUMMIT</div>
                  <div className="logo-tagline">YOUR COMMITS. YOUR CAREER.</div>
                </div>
              </div>
              <p>
                AI-powered resume intelligence for developers.
                Built around the projects, systems, and code you've already created.
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Navigation</h4>
                <a href="#features">Features</a>
                <a href="#workflow">Workflow</a>
                <a href="#contact">Contact</a>
              </div>

              <div className="footer-column">
                <h4>Profiles</h4>
                <a href="https://github.com/dragon486" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://www.linkedin.com/in/adel-muhammed-49136a282/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="mailto:adelmuhammed786@gmail.com">Email</a>
              </div>
            </div>
          </div>

          <div className="container footer-bottom">
            <div>
              © {new Date().getFullYear()} Resummit. All rights reserved.
            </div>
            <div className="creator-credit">
              Created & Founded by{" "}
              <a href="https://github.com/dragon486" target="_blank" rel="noopener noreferrer">
                Adel Muhammed
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
