// data.jsx — mock analysis data + tone-aware suggestion sets for RANKR
// Sample video: 12-minute ramen cooking tutorial

const VIDEO = {
  name: "ramen_tutorial_final_v3.mp4",
  duration: "12:04",
  size: "842 MB",
  res: "3840 × 2160 · 60fps",
  topic: "12-minute homemade ramen tutorial",
  // visual scenes the "analysis" claims to have detected
  scenes: ["Knife work / prep", "Broth simmering", "Noodle pull", "Final plating", "First-bite reaction"],
};

// ---- TITLES, keyed by tone ----
const TITLES = {
  punchy: [
    { text: "This 12-Minute Ramen Broke My Brain 🍜", ctr: 94, seo: 61, trend: 88 },
    { text: "Stop Buying Instant Ramen. Watch This.", ctr: 90, seo: 70, trend: 74 },
    { text: "The Ramen Trick Restaurants Don't Want You To Know", ctr: 88, seo: 66, trend: 81 },
    { text: "I Made Ramen in 12 Minutes And Can't Go Back", ctr: 85, seo: 64, trend: 77 },
    { text: "Everyone Is Obsessed With This 12-Min Ramen", ctr: 82, seo: 59, trend: 85 },
  ],
  balanced: [
    { text: "The Only Ramen Recipe You'll Ever Need (12 Minutes)", ctr: 89, seo: 84, trend: 79 },
    { text: "12-Minute Ramen That Tastes Like It Took Hours", ctr: 86, seo: 80, trend: 76 },
    { text: "Restaurant-Style Ramen at Home — Here's How", ctr: 83, seo: 82, trend: 70 },
    { text: "How to Make Real Ramen From Scratch (Beginner Friendly)", ctr: 78, seo: 88, trend: 64 },
    { text: "Easy Homemade Ramen — Better Than Takeout", ctr: 80, seo: 79, trend: 68 },
  ],
  seo: [
    { text: "How to Make Ramen at Home (Easy 12-Minute Recipe)", ctr: 74, seo: 95, trend: 62 },
    { text: "Homemade Ramen Recipe for Beginners — Step by Step", ctr: 70, seo: 93, trend: 58 },
    { text: "Quick Ramen Recipe: Restaurant Broth in 12 Minutes", ctr: 76, seo: 90, trend: 66 },
    { text: "Best Easy Ramen Recipe (Authentic & Fast) 2026", ctr: 72, seo: 92, trend: 71 },
    { text: "Japanese Ramen From Scratch — Simple Tutorial", ctr: 68, seo: 89, trend: 55 },
  ],
};

// ---- THUMBNAILS ---- (composed gradient/photo-placeholder concepts)
// each renders a designed thumb: bg treatment + overlay text + shot note
const THUMBS = [
  {
    id: "t1", headline: "12 MIN\nRAMEN", badge: "🔥", ctr: 93, contrast: 96,
    shot: "Tight overhead of steaming bowl, chopsticks lifting noodles",
    layout: "left-text", textColor: "#fff", chip: "Bold + steam",
  },
  {
    id: "t2", headline: "BETTER THAN\nTAKEOUT?", badge: "👀", ctr: 88, contrast: 84,
    shot: "Split frame: instant cup vs. finished bowl",
    layout: "split", textColor: "#fff", chip: "Comparison",
  },
  {
    id: "t3", headline: "SO\nEASY", badge: "✅", ctr: 79, contrast: 90,
    shot: "Creator mid-reaction, bowl in hand, big smile",
    layout: "face", textColor: "#fff", chip: "Face + emotion",
  },
  {
    id: "t4", headline: "RAMEN\nFROM SCRATCH", badge: "🍜", ctr: 74, contrast: 71,
    shot: "Clean flat-lay of raw ingredients on dark board",
    layout: "minimal", textColor: "#fff", chip: "Clean / minimal",
  },
];

// ---- DESCRIPTIONS, keyed by tone ----
const DESCRIPTIONS = {
  punchy: {
    intro: "I cannot believe this only took 12 minutes. 🍜 Full restaurant-style ramen, zero fancy equipment, and honestly it slaps harder than my local spot. Save this one — you're going to make it on repeat.",
  },
  balanced: {
    intro: "In this video I'll show you how to make restaurant-style ramen at home in about 12 minutes — a rich broth, springy noodles, and all the toppings. No special equipment, totally beginner-friendly. Recipe + timestamps below. 🍜",
  },
  seo: {
    intro: "Learn how to make easy homemade ramen in 12 minutes with this step-by-step recipe. We cover the broth, noodles, soft-boiled egg, and toppings for an authentic, restaurant-style bowl — perfect for beginners. Full written recipe and timestamps below.",
  },
};

const DESC_CHAPTERS = [
  "0:00 — Why this ramen actually works",
  "1:10 — Ingredients & shopping list",
  "2:35 — Building the broth base",
  "5:20 — Cooking the noodles right",
  "7:45 — The 6-minute soft egg",
  "9:30 — Toppings & assembly",
  "11:10 — First bite + tips",
];

// ---- TAGS ---- (trending flag = algorithm-favored right now)
const TAGS = [
  { t: "ramen recipe", trending: true, vol: "201K/mo" },
  { t: "homemade ramen", trending: true, vol: "165K/mo" },
  { t: "easy ramen", trending: false, vol: "90K/mo" },
  { t: "12 minute ramen", trending: true, vol: "trending ↑" },
  { t: "ramen from scratch", trending: false, vol: "74K/mo" },
  { t: "restaurant style ramen", trending: false, vol: "48K/mo" },
  { t: "quick dinner recipes", trending: true, vol: "320K/mo" },
  { t: "japanese food", trending: false, vol: "260K/mo" },
  { t: "noodle recipe", trending: false, vol: "110K/mo" },
  { t: "ramen broth", trending: false, vol: "55K/mo" },
  { t: "cooking tutorial", trending: false, vol: "140K/mo" },
  { t: "weeknight dinner", trending: true, vol: "180K/mo" },
];

// ---- THEMES (gradient palettes for tweaks) ----
const THEMES = {
  Sunset:   { a: "#FF6B4A", b: "#FF2E93", c: "#8B5CF6", accent: "#FF2E93" },
  Electric: { a: "#22D3EE", b: "#3B82F6", c: "#8B5CF6", accent: "#3B82F6" },
  Inferno:  { a: "#FACC15", b: "#FB7185", c: "#EF4444", accent: "#FB7185" },
  Mint:     { a: "#A3E635", b: "#10B981", c: "#06B6D4", accent: "#10B981" },
};

// analyzing screen status lines
const ANALYSIS_STEPS = [
  "Decoding video & sampling frames",
  "Detecting scenes & key moments",
  "Transcribing audio for keywords",
  "Cross-referencing trending topics",
  "Scoring against the ranking model",
  "Generating titles, thumbnails & tags",
];

// helper: average a title's three sub-scores into one
function titleScore(t) {
  return Math.round(t.ctr * 0.45 + t.seo * 0.35 + t.trend * 0.20);
}

// predicted reach from a 0-100 ctr-ish score
function predictReach(score) {
  const base = 4200 + score * score * 2.6;
  const lo = Math.round(base / 1000);
  const hi = Math.round((base * 1.7) / 1000);
  return `${lo}K–${hi}K`;
}

Object.assign(window, {
  VIDEO, TITLES, THUMBS, DESCRIPTIONS, DESC_CHAPTERS, TAGS, THEMES,
  ANALYSIS_STEPS, titleScore, predictReach,
});
