const COLORS = {
  bg: "#050507",
  bgSoft: "#0A0A12",

  card: "rgba(255, 255, 255, 0.04)",
  border: "rgba(0,224,255,0.12)",

  text: "#F5F7FF",
  textDim: "rgba(255, 255, 255, 0.7)",
  textMuted: "rgba(255,255,255,0.35)",

  neon: "#00FF87",
  neonSoft: "rgba(0,255,135,0.06)",

  neonBlue: "#00E0FF",
  neonGreen: "#00FF94",
  neonPurple: "#C084FC",
  neonAmber: "#FFCC66",
  neonRed: "#f87171", // ✅ add this line

  domains: {
    physical: "#00FF94",
    mental: "#00E0FF",
    financial: "#FFCC66",
    spiritual: "#C084FC",
    emotional: "#FF7EA3",
  },
};

export { COLORS };
// ✅ Change to named export so { COLORS } import works
