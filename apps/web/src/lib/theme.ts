// =============================================================================
// THEME (light / dark)
// -----------------------------------------------------------------------------
// How it works, in three pieces:
//  1. The colours of each theme live in styles/base/_tokens.scss. The dark ones
//     apply when <html> has the attribute data-theme="dark".
//  2. THEME_INIT_SCRIPT (below) runs inside <head> BEFORE the page is painted. It
//     reads the saved choice from localStorage and sets data-theme right away,
//     so a visitor who chose dark never sees a white flash on refresh.
//  3. The toggle button (components/ui/ThemeToggle) flips data-theme and saves
//     the new choice to localStorage.
// This file only holds what pieces 2 and 3 share.
// =============================================================================

// The name under which the choice is stored in the browser ("light" or "dark").
export const THEME_STORAGE_KEY = "altio-theme";

// Plain JavaScript as a string: it must run before React exists, so it cannot
// be a component. Order of preference:
//   1) the choice the visitor saved earlier, 2) their system setting, 3) light.
// try/catch because localStorage can be blocked (private mode, strict settings):
// then the site simply stays on the system theme and nothing breaks.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;
