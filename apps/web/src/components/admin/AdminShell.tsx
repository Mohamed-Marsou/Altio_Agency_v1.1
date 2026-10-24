"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  CircleHelp,
  FileText,
  Gift,
  History,
  Image as ImageIcon,
  Layers,
  LogOut,
  LayoutDashboard,
  Menu,
  MessageSquareQuote,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import ErrorBoundary from "@/components/system/ErrorBoundary";
import ThemeToggle from "@/components/ui/ThemeToggle/ThemeToggle";
import { LOGOUT_EVENT, fetchSession, logout } from "@/lib/admin/auth-client";
import LoginScreen from "./LoginScreen";
import { ADMIN_NAV } from "@/lib/admin/nav";
import styles from "./AdminShell.module.scss";

// nav.ts stores icon names as text; this maps each name to the real icon.
const ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  gift: Gift,
  wallet: Wallet,
  briefcase: Briefcase,
  "file-text": FileText,
  layers: Layers,
  "message-square-quote": MessageSquareQuote,
  "circle-help": CircleHelp,
  image: ImageIcon,
  "bar-chart-3": BarChart3,
  "shield-check": ShieldCheck,
  settings: Settings,
  history: History,
};

// The frame around every admin page: sidebar (a slide-in drawer on phones, always
// visible from 1024px), a top bar, and the page content.
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Login: asks the admin server whether a password is needed and whether we are logged in.
  //   checking = waiting for the answer, login = show the password screen, ready = show the dashboard
  //   (also "ready" when the server is not reachable: the pages show their own "not connected" notice).
  const [gate, setGate] = useState<"checking" | "login" | "ready">("checking");
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordMissing, setPasswordMissing] = useState(false);
  const [mode, setMode] = useState<"accounts" | "shared" | "open">("shared");
  const [who, setWho] = useState<string | null>(null); // the logged-in admin, shown in the sidebar

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const session = await fetchSession();
      if (!alive) return;
      if (session) {
        setMode(session.mode);
        setWho(session.actor?.id ? session.actor.name : null);
      }
      setPasswordRequired(Boolean(session?.required));
      setPasswordMissing(session !== null && !session.required);
      setGate(session?.required && !session.authenticated ? "login" : "ready");
    };
    void check();
    // Any request that gets "please log in" (session ended) sends us back to the password screen.
    const back = () => setGate("login");
    window.addEventListener(LOGOUT_EVENT, back);
    return () => {
      alive = false;
      window.removeEventListener(LOGOUT_EVENT, back);
    };
  }, []);

  // While the phone drawer is open: Escape closes it and the page behind cannot scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (gate === "checking") return <div className={styles.shell} aria-busy="true" />;
  if (gate === "login") return <LoginScreen mode={mode} onSuccess={() => window.location.reload()} />;

  return (
    <div className={styles.shell}>
      <aside id="admin-nav" className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`} aria-label="Admin navigation">
        <div className={styles.brandRow}>
          {/* The logo opens the public website in a new tab */}
          <a href="/" target="_blank" rel="noopener" className={styles.brand} aria-label="Altio admin: open the website in a new tab" title="Open the website in a new tab">
            Altio <span>admin</span>
          </a>
          <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.nav}>
          {ADMIN_NAV.map((group) => (
            <div key={group.title} className={styles.group}>
              <p className={styles.groupTitle}>{group.title}</p>
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] ?? LayoutDashboard;
                const inner = (
                  <>
                    <Icon size={18} aria-hidden="true" />
                    <span className={styles.itemLabel}>{item.label}</span>
                    {item.href ? (
                      item.badge ? <span className={styles.badge}>{item.badge}</span> : null
                    ) : (
                      <span className={styles.soon}>Soon</span>
                    )}
                  </>
                );
                // Built page = real link (highlighted when it is the current page).
                // Not built yet = disabled, not clickable.
                const here = pathname.endsWith("/") ? pathname : `${pathname}/`;
                const current = item.href !== undefined && (item.href === "/admindash/" ? here === item.href : here.startsWith(item.href));
                return item.href ? (
                  <Link key={item.id} href={item.href} className={`${styles.item} ${current ? styles.itemActive : ""}`} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}>
                    {inner}
                  </Link>
                ) : (
                  <span key={item.id} className={`${styles.item} ${styles.itemDisabled}`} aria-disabled="true">
                    {inner}
                  </span>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">{(who ?? "A").charAt(0).toUpperCase()}</span>
          <span>
            <strong>{who ?? "Altio team"}</strong>
            <small>{who ? "Admin" : mode === "shared" ? "Shared password" : "Local"}</small>
          </span>
        </div>
      </aside>

      {/* Dark layer behind the phone drawer; tapping it closes the drawer */}
      {open && <button type="button" className={styles.scrim} onClick={() => setOpen(false)} aria-label="Close menu" />}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={styles.menuBtn} onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="admin-nav">
            <Menu size={20} aria-hidden="true" />
          </button>
          {/* Only the Overview still uses made-up numbers; the Audit log is real data */}
          <span className={styles.sample}>{pathname === "/admindash" || pathname === "/admindash/" ? "Sample data" : "Live data"}</span>
          {passwordRequired && (
            <button
              type="button"
              className={styles.menuBtn}
              style={{ display: "inline-flex" }}
              aria-label="Log out"
              title="Log out"
              onClick={async () => {
                await logout();
                setGate("login");
              }}
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          )}
          <ThemeToggle label="Toggle dark mode" />
        </header>
        {passwordMissing && (
          <p role="note" style={{ margin: 0, padding: "0.5rem 1rem", fontSize: "0.8125rem", background: "var(--color-surface-2)", color: "var(--color-muted)" }}>
            No login is set (fine on your own computer). Add the first admin on the Users page, or run <code>npm run admin:password</code> and restart.
          </p>
        )}
        <main className={styles.content}>
          {/* If a page inside crashes, only this area is replaced and the crash is logged */}
          <ErrorBoundary name="AdminPage">{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
