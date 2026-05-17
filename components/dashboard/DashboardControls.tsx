"use client";

import React, { useState } from "react";
import { Bell, Settings, User, X, Check, Shield, Cpu, RefreshCw, Moon, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DashboardControlsProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: "success" | "info" | "warning";
}

export function DashboardControls({ user }: DashboardControlsProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiModel, setAiModel] = useState("gemini");
  const [autoSync, setAutoSync] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "GitHub Sync Successful",
      desc: "Successfully parsed 12 repositories and README assets.",
      time: "Just now",
      read: false,
      type: "success",
    },
    {
      id: "2",
      title: "ATS Resume Audit Complete",
      desc: "Semantic intelligence score increased to 82/100.",
      time: "10 mins ago",
      read: false,
      type: "info",
    },
    {
      id: "3",
      title: "Gemini Key Status Active",
      desc: "Google generative developer endpoints verified.",
      time: "1 hour ago",
      read: true,
      type: "success",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="relative flex items-center gap-4">
      {/* ── Notification Trigger ── */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowSettings(false);
          }}
          className={`p-2.5 rounded-xl border border-white/5 bg-neutral-900/40 hover:bg-neutral-800/80 transition-all text-neutral-400 hover:text-white cursor-pointer relative ${
            showNotifications ? "text-white bg-neutral-800/80" : ""
          }`}
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[9px] font-black text-white ring-2 ring-neutral-950 animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <>
              {/* Invisible backdrop to close on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 md:w-96 rounded-3xl bg-neutral-900/95 border border-white/10 backdrop-blur-xl shadow-2xl z-50 p-5 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                    System Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 text-[11px] font-medium uppercase tracking-wider">
                      All caught up!
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border transition-all relative group/item ${
                          n.read
                            ? "bg-neutral-950/20 border-white/5"
                            : "bg-white/[0.02] border-blue-500/10 shadow-sm"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {!n.read && (
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                              )}
                              <span className="text-xs font-bold text-neutral-200">
                                {n.title}
                              </span>
                            </div>
                            <p className="text-[10.5pt] text-neutral-400 font-light mt-1 leading-relaxed">
                              {n.desc}
                            </p>
                            <span className="text-[9px] font-semibold text-neutral-600 block mt-2 uppercase tracking-wide">
                              {n.time}
                            </span>
                          </div>
                          <button
                            onClick={() => clearNotification(n.id)}
                            className="text-neutral-600 hover:text-white p-1 hover:bg-white/5 rounded transition-all cursor-pointer opacity-0 group-hover/item:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Settings Trigger ── */}
      <button
        onClick={() => {
          setShowSettings(true);
          setShowNotifications(false);
        }}
        className={`p-2.5 rounded-xl border border-white/5 bg-neutral-900/40 hover:bg-neutral-800/80 transition-all text-neutral-400 hover:text-white cursor-pointer relative ${
          showSettings ? "text-white bg-neutral-800/80" : ""
        }`}
      >
        <Settings className="w-4.5 h-4.5" />
      </button>

      {/* Settings Side-Drawer */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 cursor-pointer"
              onClick={() => setShowSettings(false)}
            />

            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-neutral-950/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl z-50 p-8 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider">
                        Settings OS
                      </h3>
                      <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest mt-0.5">
                        Configure Sclade Parameters
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-6">
                  {/* AI Model Calibrator */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block">
                      AI Generation Model
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <button
                        onClick={() => setAiModel("gemini")}
                        className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          aiModel === "gemini"
                            ? "bg-white text-black shadow-lg"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        Gemini Pro
                      </button>
                      <button
                        onClick={() => setAiModel("claude")}
                        className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          aiModel === "claude"
                            ? "bg-white text-black shadow-lg"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Claude 3.5
                      </button>
                    </div>
                  </div>

                  {/* Sync Automation */}
                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-200 block">
                        Auto-Update Resume
                      </span>
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide mt-1 block">
                        Trigger updates on GitHub pushes
                      </span>
                    </div>
                    <button
                      onClick={() => setAutoSync(!autoSync)}
                      className={`w-11 h-6 rounded-full transition-all relative p-0.5 cursor-pointer ${
                        autoSync ? "bg-blue-600" : "bg-neutral-800"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full block transition-all shadow-md ${
                          autoSync ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Theme Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block">
                      Theme Interface
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex-1 py-3 px-4 border rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          theme === "dark"
                            ? "bg-neutral-900 border-blue-500/30 text-white"
                            : "bg-transparent border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-blue-400" />
                        Deep Dark
                      </button>
                    </div>
                  </div>

                  {/* Account Security */}
                  <div className="p-5 rounded-3xl bg-neutral-900/30 border border-white/5 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-neutral-300">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Security & Database Status</span>
                    </div>
                    <div className="space-y-2 text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">
                      <div className="flex justify-between">
                        <span>Database Mode:</span>
                        <span className="text-neutral-400">Postgres Integration</span>
                      </div>
                      <div className="flex justify-between">
                        <span>API Access Level:</span>
                        <span className="text-emerald-400">Premium Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Save button */}
              <div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4.5 bg-white text-black hover:bg-neutral-200 active:scale-98 transition-all font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Save Parameters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── User Avatar ── */}
      <div className="h-8 w-[1px] bg-white/10 mx-2" />
      <div className="flex items-center gap-3 pl-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/5 flex items-center justify-center overflow-hidden">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || ""}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <User className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </div>
    </div>
  );
}
