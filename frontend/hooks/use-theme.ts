"use client";

import { useState, useEffect, useCallback } from "react";

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = saved ? saved === "dark" : sysDark;
      setDark(isDark);
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "theme") {
        const next = ev.newValue === "dark";
        setDark(next);
        if (next) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }
    };

    const onCustom = (ev: Event) => {
      try {
        const ce = ev as CustomEvent<boolean>;
        if (typeof ce.detail === "boolean") {
          // Defer state update to avoid cross-component update during render
          setTimeout(() => setDark(ce.detail as boolean), 0);
        }
      } catch {}
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("tadbir_theme_changed", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tadbir_theme_changed", onCustom as EventListener);
    };
  }, []);

  const apply = (next: boolean) => {
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", next ? "dark" : "light");
    try {
      // Defer the broadcast so listeners update after current render commit
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("tadbir_theme_changed", { detail: next }));
      }, 0);
    } catch {}
  };

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      apply(next);
      return next;
    });
  }, []);

  const setTheme = useCallback((value: boolean) => {
    setDark(value);
    apply(value);
  }, []);

  return { dark, toggle, setTheme };
}
