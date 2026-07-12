"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  if (compact) {
    return (
      <div
        className="inline-flex w-full items-center rounded border border-[var(--border-default)] bg-[var(--surface)] p-0.5"
        role="group"
        aria-label="테마 선택"
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          aria-pressed={!isDark}
          className={`flex-1 rounded px-3 py-2 text-xs font-semibold transition ${
            !isDark
              ? "bg-signature-dark text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          라이트
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          aria-pressed={isDark}
          className={`flex-1 rounded px-3 py-2 text-xs font-semibold transition ${
            isDark
              ? "bg-signature-dark text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          다크
        </button>
      </div>
    );
  }

  return (
    <div
      className="inline-flex shrink-0 items-center rounded border border-[var(--border-default)] bg-[var(--surface)] p-0.5"
      role="group"
      aria-label="테마 선택"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
          !isDark
            ? "bg-signature-dark text-white"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`}
      >
        라이트
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
          isDark
            ? "bg-signature-dark text-white"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`}
      >
        다크
      </button>
    </div>
  );
}
