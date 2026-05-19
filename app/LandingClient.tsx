"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { GitBranch, Brain, FileDown, KeyRound, Terminal, Cpu, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

export function LandingClient({ hasSession }: { hasSession?: boolean }) {
  useEffect(() => {
    // Theme toggle logic
    const root = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");

    const savedTheme = localStorage.getItem("resummit-theme");
    if (savedTheme) {
      root.setAttribute("data-theme", savedTheme);
      if (themeToggle) {
        themeToggle.textContent = savedTheme === "dark" ? "🌙" : "☀️";
      }
    } else {
      // Default to dark theme as in user's HTML
      root.setAttribute("data-theme", "dark");
      if (themeToggle) {
        themeToggle.textContent = "🌙";
      }
    }

    const handleThemeClick = () => {
      const current = root.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";

      root.setAttribute("data-theme", next);
      localStorage.setItem("resummit-theme", next);

      // Also sync with Sclade global controls if possible
      localStorage.setItem("sclade-theme", next);
      if (next === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }

      if (themeToggle) {
        themeToggle.textContent = next === "dark" ? "🌙" : "☀️";
      }
    };

    if (themeToggle) {
      themeToggle.addEventListener("click", handleThemeClick);
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
      if (themeToggle) {
        themeToggle.removeEventListener("click", handleThemeClick);
      }
      observer.disconnect();
    };
  }, []);

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

        .landing-body .logo {
          display: flex;
          align-items: center;
          gap: 14px;
          font-weight: 800;
          font-size: 1.2rem;
          letter-spacing: -0.04em;
        }

        .landing-body .logo-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--primary), #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(79, 140, 255, 0.28);
        }

        .landing-body .logo-icon::before {
          content: '';
          position: absolute;
          width: 120%;
          height: 120%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), transparent);
          transform: rotate(25deg);
          top: -40%;
          left: -20%;
        }

        .landing-body .logo-mark {
          font-size: 1rem;
          font-weight: 900;
          color: white;
          z-index: 2;
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

        .landing-body .theme-toggle {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
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
          padding: 50px 0;
          border-top: 1px solid var(--border);
        }

        .landing-body .footer-grid {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          flex-wrap: wrap;
          align-items: flex-start;
        }

        .landing-body .footer-left p {
          margin-top: 14px;
          color: var(--muted);
          max-width: 360px;
        }

        .landing-body .footer-links {
          display: flex;
          gap: 50px;
          flex-wrap: wrap;
        }

        .landing-body .footer-column h4 {
          margin-bottom: 14px;
          font-size: 0.95rem;
        }

        .landing-body .footer-column a {
          display: block;
          margin-bottom: 10px;
          color: var(--muted);
          text-decoration: none;
          transition: 0.3s;
        }

        .landing-body .footer-column a:hover {
          color: var(--text);
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
      ` }} />

      <div className="landing-body">
        {/* Navigation */}
        <nav>
          <div className="container nav-inner">
            <div className="logo">
              <div className="logo-icon">
                <div className="logo-mark">R</div>
              </div>
              <div>Resum<span>mit</span></div>
            </div>

            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#workflow">Workflow</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="nav-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button className="theme-toggle" id="themeToggle">🌙</button>
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
                <a href="#features" className="secondary-btn">See Resume Preview</a>
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
                Resummit turns real engineering work into professional resumes
                developers can confidently share with recruiters and hiring teams.
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
                <div className="logo-icon">
                  <div className="logo-mark">R</div>
                </div>
                <div>Resum<span>mit</span></div>
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
        </footer>
      </div>
    </>
  );
}
