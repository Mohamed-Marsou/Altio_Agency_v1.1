// Small pure helpers for the admin screens (easy to test).
import type { MediaEntry, PostBlockInput, PostRecord, ProjectRecord, ProjectText } from "./schemas";

/** "Hello World! 2026" -> "hello-world-2026". Returns "" for text with no latin letters or digits. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // accents: é -> e
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** The smallest variant that is at least `width` wide (for thumbnails). */
export function pickVariant(media: MediaEntry, width = 480) {
  const sorted = [...media.variants].sort((a, b) => a.width - b.width);
  return sorted.find((v) => v.width >= width) ?? sorted[sorted.length - 1];
}

const blankPostText = () => ({ title: "", excerpt: "", featuredExcerpt: "", body: [{ type: "p", text: "" }] as PostBlockInput[] });

export function emptyPost(): PostRecord {
  return {
    slug: "",
    category: "tips",
    featured: false,
    date: new Date().toISOString().slice(0, 10),
    readTime: 4,
    cover: null,
    i18n: { en: blankPostText(), fr: blankPostText(), ar: blankPostText() },
  };
}

/** A starting point for the case study of a new project (the owner edits the words). */
export function caseTemplate(): ProjectText["case"] {
  return {
    heroTitle: "Client name,",
    heroAccent: "what changed for them.",
    heroLead: "One or two sentences about the client and the challenge.",
    liveSince: "Live since Month 2026",
    facts: { client: "Type of client", service: "Service", timeline: "4 weeks", stack: "Next.js · Node.js" },
    problem: { title: "The problem in one line", lead: "Why it mattered.", pains: ["First pain", "Second pain"], notes: ["Note one", "Note two"] },
    journey: [
      { when: "Week 1", title: "Discover", text: "What we learned." },
      { when: "Within 72 h", title: "Free design", text: "What we designed." },
      { when: "Weeks 2 to 3", title: "Build", text: "What we built." },
      { when: "Week 4", title: "Launch and grow", text: "How it went live." },
    ],
    built: [{ title: "Feature one", text: "What it does for them.", visual: "listing" }],
    compare: { before: [{ label: "Mobile speed", value: 40 }], after: [{ label: "Mobile speed", value: 95 }] },
    results: [{ value: "×2", label: "More enquiries", note: "Measured over 3 months" }],
    quote: { text: "What the client said.", by: "Owner, Client name" },
  };
}

const blankProjectText = (): ProjectText => ({ tag: "", title: "", featuredTitle: "", teaser: "", result: "", stats: [], case: caseTemplate() });

export function emptyProject(): ProjectRecord {
  return {
    slug: "",
    vibe: "app",
    art: "app",
    featured: false,
    status: "live",
    url: "",
    category: "websites",
    cover: null,
    i18n: { en: blankProjectText(), fr: blankProjectText(), ar: blankProjectText() },
  };
}

export const BLOCK_LABELS: Record<PostBlockInput["type"], string> = {
  p: "Paragraph",
  h2: "Section title",
  quote: "Quote",
  callout: "Tip box",
  figure: "Picture caption",
};

export function emptyBlock(type: PostBlockInput["type"], index: number): PostBlockInput {
  switch (type) {
    case "h2":
      return { type, id: `section-${index + 1}`, text: "" };
    case "callout":
      return { type, title: "", items: [""] };
    case "figure":
      return { type, caption: "" };
    default:
      return { type, text: "" };
  }
}

/** The id for a section title: from the text when possible, otherwise section-N. */
export function sectionId(text: string, index: number): string {
  return slugify(text) || `section-${index + 1}`;
}
