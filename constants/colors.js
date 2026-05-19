// constants/colors.js — 1Life Hub
// Strict 5-colour palette

const COLORS = {
  // ── Core 5 ───────────────────────────────────────────────────
  bg: "#130101", // Coffee Bean — all backgrounds
  blue: "#441FFF", // Blue — primary actions, active states, Routine screen
  green: "#00B85C", // Green — XP, growth, goals hit, Today screen
  orange: "#FF4B0A", // Orange — warnings, deadlines, alerts only
  white: "#FFFFFF", // White — all text, icons

  // RED for Physical screen (replaces orange there)
  red: "#E8001C", // Red — Physical Health screen identity

  // ── Aliases (keep backward compat with existing screens) ─────
  neonGreen: "#00B85C",
  neonBlue: "#441FFF",
  neonAmber: "#FF4B0A",
  neonRed: "#E8001C",
  neonPurple: "#441FFF", // map to blue — no purple in palette

  // ── Text ──────────────────────────────────────────────────────
  text: "#FFFFFF",
  textDim: "rgba(255,255,255,0.65)",
  textMuted: "rgba(255,255,255,0.35)",

  // ── Surfaces ──────────────────────────────────────────────────
  bgSoft: "#1a0101",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",

  // ── Domain colours (mapped to palette) ───────────────────────
  domains: {
    physical: "#E8001C", // red
    mental: "#441FFF", // blue
    financial: "#FF4B0A", // orange
    spiritual: "#441FFF", // blue
    emotional: "#00B85C", // green
    personal: "#00B85C", // green
  },
};

export { COLORS };
