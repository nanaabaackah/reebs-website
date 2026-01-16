import { useEffect, useState } from "react";

const THEME_KEY = "reebs-theme";
const QUERY = "(prefers-color-scheme: dark)";

const getWindow = () => (typeof window === "object" ? window : null);

const getStoredTheme = () => {
  const win = getWindow();
  return win?.localStorage?.getItem(THEME_KEY) ?? null;
};

const preferDark = () => {
  const win = getWindow();
  if (!win || !win.matchMedia) return false;
  return win.matchMedia(QUERY).matches;
};

export default function useThemeMode() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = getStoredTheme();
    if (stored) return stored === "dark";
    return preferDark();
  });

  const [hasUserThemePreference, setHasUserThemePreference] = useState(() => Boolean(getStoredTheme()));

  useEffect(() => {
    const win = getWindow();
    if (!win || !win.matchMedia) return undefined;
    const media = win.matchMedia(QUERY);
    const handleChange = (event) => {
      if (!hasUserThemePreference) {
        setDarkMode(event.matches);
      }
    };
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, [hasUserThemePreference]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    const win = getWindow();
    if (!win) return undefined;
    if (hasUserThemePreference) {
      win.localStorage.setItem(THEME_KEY, theme);
    } else {
      win.localStorage.removeItem(THEME_KEY);
    }
  }, [darkMode, hasUserThemePreference]);

  const toggleTheme = () => {
    setHasUserThemePreference(true);
    setDarkMode((prev) => !prev);
  };

  return { darkMode, toggleTheme };
}
