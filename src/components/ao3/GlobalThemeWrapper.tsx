"use client";

import React, { useEffect, useState } from "react";
import { READER_THEMES, useReaderStore } from "@/store/useReaderStore";

export function GlobalThemeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useReaderStore();
  const [mounted, setMounted] = useState(false);

  // Evitar Hydration Mismatch entre o SSR do Next.js e o localStorage do Zustand
  const activeTheme = mounted
    ? READER_THEMES[theme] || READER_THEMES.cream
    : READER_THEMES.cream;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.style.setProperty("--app-bg", activeTheme.bg);
    root.style.setProperty("--app-surface", activeTheme.surface);
    root.style.setProperty("--app-text", activeTheme.text);
    root.style.setProperty("--app-muted", activeTheme.muted);
    root.style.setProperty("--app-border", activeTheme.border);
    root.style.setProperty("--app-accent", activeTheme.accent);
    document.body.style.backgroundColor = activeTheme.bg;
    document.body.style.color = activeTheme.text;
  }, [activeTheme, mounted]);

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
      }}
    >
      {children}
    </div>
  );
}
