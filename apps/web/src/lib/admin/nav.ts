// The sidebar of the admin dashboard. Only "Overview" is built today; every other
// page is listed so the team can see the plan, and shown as "Soon" (not clickable).
// To build a page later: add `href` to its entry and create the route.

export type AdminNavItem = {
  id: string;
  label: string;
  /** lucide-react icon name, looked up in AdminNav */
  icon: string;
  /** present only when the page exists */
  href?: string;
  /** number shown in the badge (sample for now; later from the API) */
  badge?: number;
};

export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Pipeline",
    items: [
      { id: "overview", label: "Overview", icon: "layout-dashboard", href: "/admindash/" },
      { id: "leads", label: "Leads", icon: "users", badge: 12 },
      { id: "referrals", label: "Referrals", icon: "gift", badge: 3 },
      { id: "payments", label: "Payments", icon: "wallet" },
    ],
  },
  {
    title: "Content",
    items: [
      { id: "projects", label: "Projects", icon: "briefcase", href: "/admindash/projects/" },
      { id: "blog", label: "Blog", icon: "file-text", href: "/admindash/blog/" },
      { id: "services", label: "Services and packs", icon: "layers" },
      { id: "testimonials", label: "Testimonials", icon: "message-square-quote" },
      { id: "faq", label: "FAQ", icon: "circle-help" },
      { id: "media", label: "Media", icon: "image", href: "/admindash/media/" },
    ],
  },
  {
    title: "Insights",
    items: [{ id: "analytics", label: "Analytics", icon: "bar-chart-3" }],
  },
  {
    title: "System",
    items: [
      { id: "users", label: "Users and admins", icon: "shield-check", href: "/admindash/users/" },
      { id: "settings", label: "Settings", icon: "settings" },
      { id: "audit", label: "Audit log", icon: "history", href: "/admindash/audit/" },
    ],
  },
];
