export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "bc-theme";
export const DEFAULT_THEME: Theme = "light";

export const themeInitScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var t=localStorage.getItem(k);var d=t==="dark";var r=document.documentElement;r.classList.toggle("dark",d);r.dataset.theme=d?"dark":"light";r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === "dark";

  root.classList.toggle("dark", isDark);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
}
