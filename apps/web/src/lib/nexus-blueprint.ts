/**
 * NEXUS Super-App Blueprint — 2026 Edition (outline).
 * Synchronized to the PDF table-of-contents / pillars in
 * `NEXUS_Super_App_Blueprint_2026.pdf` (local copy may be summary-only).
 * @see file:///c:/Users/LENOVO/Downloads/NEXUS_Super_App_Blueprint_2026.pdf
 */

export const BLUEPRINT_SOURCE =
  "NEXUS_Super_App_Blueprint_2026.pdf — Chat · Commerce · Social · Streaming · Gaming · App Ecosystem · AI";

export type BlueprintCoverage = "mvp" | "partial" | "roadmap";

export type BlueprintSection = {
  id: string;
  title: string;
  coverage: BlueprintCoverage;
  detail: string;
};

/** Sections 01–13 from the blueprint document outline. */
export const BLUEPRINT_SECTIONS: BlueprintSection[] = [
  {
    id: "01",
    title: "Platform vision & core pillars",
    coverage: "partial",
    detail: "Seven pillars surfaced in-app; broader vision copy lives on marketing site.",
  },
  {
    id: "02",
    title: "Super-app vision — one app, every experience",
    coverage: "partial",
    detail: "Single authenticated workspace with pillar navigation.",
  },
  {
    id: "03",
    title: "NexOS — app ecosystem inside NEXUS",
    coverage: "mvp",
    detail: "User-scoped mini-apps in Supabase with realtime sync.",
  },
  {
    id: "04",
    title: "Advertising engine — smart, respectful, profitable",
    coverage: "roadmap",
    detail: "Privacy-first ads not implemented; UI calls this out below.",
  },
  {
    id: "05",
    title: "Subscription plans & advertising tiers",
    coverage: "partial",
    detail: "Commerce checkout, cart, order history with cancel + load-more, and illustrative tier cards; no billing provider yet.",
  },
  {
    id: "06",
    title: "Mobile — iOS & Android",
    coverage: "roadmap",
    detail: "Responsive web shell; native shells not in this repo.",
  },
  {
    id: "07",
    title: "Video streaming — long-form & cinema",
    coverage: "partial",
    detail: "Catalog, HTML5 playback, watchlist, filters; not a full CMS.",
  },
  {
    id: "08",
    title: "Backend services",
    coverage: "mvp",
    detail: "Supabase Postgres, RLS, Realtime for core modules; order status updates and chat message edits flow through the same API.",
  },
  {
    id: "09",
    title: "AI & ML systems",
    coverage: "partial",
    detail: "Intent router + optional twin briefing (local); no hosted model yet.",
  },
  {
    id: "10",
    title: "Data architecture",
    coverage: "partial",
    detail: "Typed client + migrations; analytics warehouse out of scope.",
  },
  {
    id: "11",
    title: "Infrastructure & DevOps",
    coverage: "roadmap",
    detail: "Deploy targets (e.g. Workers) per project; not codified here.",
  },
  {
    id: "12",
    title: "Security architecture",
    coverage: "partial",
    detail: "Auth + RLS + TLS; full zero-trust program is roadmap.",
  },
  {
    id: "13",
    title: "Engineering principles",
    coverage: "partial",
    detail: "Focused increments in this codebase; see repo guidelines.",
  },
];

export const BLUEPRINT_KEY_THEMES = [
  "Intent-first feed",
  "AI identity twins",
  "Native messaging + commerce + streaming",
  "Privacy-first advertising",
  "Multi-region scalable backend",
  "Zero-trust security",
  "Super-app ecosystem via NexOS",
] as const;

export type SubscriptionTierCard = {
  id: string;
  name: string;
  priceLabel: string;
  blurb: string;
  features: string[];
  blueprintRef: string;
};

/** Illustrative tiers aligned to blueprint §05 (not connected to Stripe). */
export const SUBSCRIPTION_TIER_CARDS: SubscriptionTierCard[] = [
  {
    id: "free",
    name: "Explorer",
    priceLabel: "$0",
    blurb: "Entry tier in the blueprint: core pillars with standard limits.",
    features: ["Chat & alerts", "Social read/write", "Streaming catalog", "Single-region default"],
    blueprintRef: "§05 — base tier",
  },
  {
    id: "creator",
    name: "Creator",
    priceLabel: "From $19/mo",
    blurb: "Maps to marketplace add-ons (e.g. Creator Pass) in the commerce module.",
    features: ["Commerce add-ons", "Higher relay priority (roadmap)", "Watchlist sync"],
    blueprintRef: "§05 — creator / monetization",
  },
  {
    id: "pro",
    name: "Network Pro",
    priceLabel: "Custom",
    blurb: "Enterprise-style controls: multi-region, ads tier, SSO — roadmap.",
    features: ["Dedicated support (roadmap)", "Advertising tier controls (roadmap)", "Advanced security reviews"],
    blueprintRef: "§05 + §12 — org tier",
  },
];

export const AI_TWIN_BRIEFING_STORAGE_KEY = "nexus-ai-twin-briefing-v1";
