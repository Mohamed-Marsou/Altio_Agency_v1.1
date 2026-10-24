// =============================================================================
// ADMIN OVERVIEW DATA  (SAMPLE DATA for now)
// -----------------------------------------------------------------------------
// The dashboard reads everything through getAdminOverview(period). Today that
// function returns made-up numbers so the screen can be designed and tested.
// When the API exists (GET /v1/admin/analytics/overview + /v1/admin/leads), only
// this file changes: the component keeps the same types and does not care where
// the data comes from.
// =============================================================================

export type Period = "7d" | "30d";

export type LeadStatus = "NEW" | "CONTACTED" | "DESIGN_SENT" | "PROPOSAL" | "WON";

export type Kpi = {
  key: "leads" | "conversion" | "visitors" | "reply";
  label: string;
  value: string;
  delta: string;
  /** true when this change is good news (a lower reply time is good). */
  isGood: boolean;
  points: number[];
};

export type AttentionItem = {
  key: "new" | "followups" | "payments" | "rewards";
  label: string;
  count: number;
  detail: string;
  /** the section of the page this card jumps to */
  target: string;
  tone: "accent" | "warning" | "danger" | "success";
};

export type OverviewLead = {
  id: string;
  name: string;
  business: string;
  service: string;
  source: string;
  status: LeadStatus;
  /** digits only, used to build the WhatsApp link */
  phone: string;
  age: string;
  needsReply: boolean;
};

export type Task = { id: string; text: string; due: string };

export type PaymentDue = {
  id: string;
  client: string;
  milestone: string;
  amount: string;
  /** negative = overdue (days), positive = days left */
  inDays: number;
};

export type ActivityItem = { id: string; text: string; time: string };

export type AdminOverview = {
  kpis: Kpi[];
  attention: AttentionItem[];
  funnel: { label: string; value: number }[];
  leads: OverviewLead[];
  tasks: Task[];
  payments: PaymentDue[];
  activity: ActivityItem[];
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  DESIGN_SENT: "Design sent",
  PROPOSAL: "Proposal",
  WON: "Won",
};

const leads: OverviewLead[] = [
  { id: "l1", name: "Sara B.", business: "Atlas Immo · Tangier", service: "Website", source: "WhatsApp", status: "NEW", phone: "212600000001", age: "12 min", needsReply: true },
  { id: "l2", name: "Omar L.", business: "Salon Ines · Tangier", service: "Website", source: "Google", status: "NEW", phone: "212600000002", age: "1 h", needsReply: true },
  { id: "l3", name: "Karim A.", business: "Café Médina", service: "Managed", source: "Google", status: "CONTACTED", phone: "212600000003", age: "2 h", needsReply: false },
  { id: "l4", name: "Imane R.", business: "Nour Boutique", service: "Store", source: "Referral", status: "DESIGN_SENT", phone: "212600000004", age: "1 d", needsReply: false },
  { id: "l5", name: "Youssef T.", business: "Clinique Tanger", service: "Web app", source: "Instagram", status: "PROPOSAL", phone: "212600000005", age: "2 d", needsReply: true },
];

const tasks: Task[] = [
  { id: "t1", text: "Send the free design to Karim A.", due: "Today" },
  { id: "t2", text: "Follow up Youssef T. on the proposal", due: "Today" },
  { id: "t3", text: "Approve the reward for Hassan K.", due: "Tomorrow" },
];

const payments: PaymentDue[] = [
  { id: "p1", client: "Nour Boutique", milestone: "MVP shown, 30%", amount: "600 MAD", inDays: -2 },
  { id: "p2", client: "Atlas Immo", milestone: "Final, 40%", amount: "1,400 MAD", inDays: 3 },
  { id: "p3", client: "Café Médina", milestone: "Managed, monthly", amount: "500 MAD", inDays: 6 },
];

const activity: ActivityItem[] = [
  { id: "a1", text: "Sara B. sent a free-design request", time: "12 min ago" },
  { id: "a2", text: "Mister MTM moved Imane R. to Design sent", time: "1 h ago" },
  { id: "a3", text: "Hassan K. paid the final 40%", time: "3 h ago" },
  { id: "a4", text: "New referral from Hassan K.: Dr Fassi clinic", time: "Yesterday" },
];

const data: Record<Period, AdminOverview> = {
  "7d": {
    kpis: [
      { key: "leads", label: "Leads", value: "24", delta: "+18% vs last week", isGood: true, points: [3, 5, 4, 7, 6, 9, 8, 11] },
      { key: "conversion", label: "Conversion", value: "6.1%", delta: "+0.8 pt", isGood: true, points: [4, 4, 5, 5, 6, 5, 7, 8] },
      { key: "visitors", label: "Visitors", value: "1,840", delta: "+9%", isGood: true, points: [5, 6, 5, 8, 7, 9, 10, 12] },
      { key: "reply", label: "First reply", value: "14 min", delta: "6 min faster", isGood: true, points: [9, 8, 8, 6, 7, 5, 4, 3] },
    ],
    attention: [
      { key: "new", label: "New leads", count: 2, detail: "Oldest waiting 1 h", target: "leads", tone: "accent" },
      { key: "followups", label: "Follow-ups today", count: 2, detail: "1 is a proposal", target: "tasks", tone: "warning" },
      { key: "payments", label: "Overdue payments", count: 1, detail: "600 MAD, 2 days", target: "payments", tone: "danger" },
      { key: "rewards", label: "Rewards to grant", count: 1, detail: "Client fully paid", target: "activity", tone: "success" },
    ],
    funnel: [
      { label: "New", value: 24 },
      { label: "Contacted", value: 19 },
      { label: "Design sent", value: 12 },
      { label: "Proposal", value: 7 },
      { label: "Won", value: 3 },
    ],
    leads,
    tasks,
    payments,
    activity,
  },
  "30d": {
    kpis: [
      { key: "leads", label: "Leads", value: "92", delta: "+8% vs last month", isGood: true, points: [6, 7, 7, 8, 9, 8, 10, 11] },
      { key: "conversion", label: "Conversion", value: "6.4%", delta: "+0.9 pt", isGood: true, points: [5, 5, 6, 6, 6, 7, 7, 8] },
      { key: "visitors", label: "Visitors", value: "7,420", delta: "+12%", isGood: true, points: [6, 7, 7, 8, 9, 9, 10, 12] },
      { key: "reply", label: "First reply", value: "19 min", delta: "2 min slower", isGood: false, points: [4, 5, 5, 4, 6, 6, 7, 6] },
    ],
    attention: [
      { key: "new", label: "New leads", count: 2, detail: "Oldest waiting 1 h", target: "leads", tone: "accent" },
      { key: "followups", label: "Follow-ups today", count: 2, detail: "1 is a proposal", target: "tasks", tone: "warning" },
      { key: "payments", label: "Overdue payments", count: 1, detail: "600 MAD, 2 days", target: "payments", tone: "danger" },
      { key: "rewards", label: "Rewards to grant", count: 1, detail: "Client fully paid", target: "activity", tone: "success" },
    ],
    funnel: [
      { label: "New", value: 92 },
      { label: "Contacted", value: 71 },
      { label: "Design sent", value: 46 },
      { label: "Proposal", value: 26 },
      { label: "Won", value: 11 },
    ],
    leads,
    tasks,
    payments,
    activity,
  },
};

export function getAdminOverview(period: Period): AdminOverview {
  return data[period];
}
