"use client";

/**
 * Light/dark for the app chrome (not the résumé page, which has its own
 * appearance setting in the theme customiser).
 *
 * Every route needs this — the dashboard, the gallery and the editor are
 * separate pages, and the attribute lives on <html>, so each has to apply the
 * stored preference on mount or it flashes the default first.
 */

const KEY = "cvBuilderDark";

/** Dark is the default register: the chrome recedes so the paper stands out. */
export function readChromeTheme(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

export function applyChromeTheme(dark: boolean) {
  document.documentElement.setAttribute("data-cv-theme", dark ? "dark" : "light");
}

export function storeChromeTheme(dark: boolean) {
  try {
    localStorage.setItem(KEY, String(dark));
  } catch {
    // Blocked storage: the attribute above still applies for this session.
  }
}

/** Read, apply and return — the usual mount-time sequence. */
export function initChromeTheme(): boolean {
  const dark = readChromeTheme();
  applyChromeTheme(dark);
  return dark;
}

export function setChromeTheme(dark: boolean) {
  applyChromeTheme(dark);
  storeChromeTheme(dark);
}
