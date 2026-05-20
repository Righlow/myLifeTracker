/**
 * screens/BonsaiGrowthModel.js — 1Life Hub | Bonsai Growth Visualisation
 *
 * PURPOSE:
 * The emotional core of the app. An SVG-based bonsai tree that grows through
 * 5 stages based on the user's cumulative XP earned from habits, health goals,
 * and routine completion. The plant provides a living, visual metaphor for
 * personal growth — the more consistent the user, the bigger the tree.
 *
 * GROWTH STAGES (based on XP thresholds):
 *  0    XP → Seed     (tiny sprout, no branches)
 *  100  XP → Seedling (small trunk, first leaves)
 *  300  XP → Sapling  (branches visible, fuller canopy)
 *  600  XP → Young    (wide canopy, bark detail)
 *  1000 XP → Mature   (full bonsai with glowing aura)
 *
 * KEY FEATURES:
 *  - Fully procedural SVG — no image assets, scales to any size
 *  - Animated radial pulse/glow effect on the canopy
 *  - Circular XP progress ring with percentage label
 *  - Stage label pill (SEED / SEEDLING / SAPLING / YOUNG / MATURE)
 *  - XP progress bar showing progress to next stage
 *  - Smooth transitions between stages as XP accumulates
 *
 * DESIGN DECISION:
 * A bonsai was chosen specifically because it requires patience and daily care —
 * a direct metaphor for habit building. The procedural SVG approach (rather than
 * static images) means the tree looks different at every XP level, rewarding
 * users for each incremental improvement rather than only at stage thresholds.
 *
 * XP SOURCES (calculated in Today.js):
 *  - Health score × 200 (max 200 XP/day)
 *  - Habit score × 200 (max 200 XP/day)
 *  - Routine score × 100 (max 100 XP/day)
 *  Total possible: 500 XP/day
 */
// screens/BonsaiGrowthModel.js  —  1Life Hub
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import Svg, { Path, Circle, Ellipse, G, Line } from "react-native-svg";
import { COLORS } from "../constants/colors";

const { width } = Dimensions.get("window");
const W = width - 28;
const H = 260;

const DOMAIN_COLORS = {
  physical: COLORS.domains?.physical || "#00e87a",
  mental: COLORS.domains?.mental || "#60a5fa",
  financial: COLORS.domains?.financial || "#fbbf24",
  spiritual: COLORS.domains?.spiritual || "#c084fc",
  emotional: COLORS.domains?.emotional || "#f472b6",
  personal: "#34d399",
};

const BLOOM_POSITIONS = [
  { x: W * 0.5, y: H * 0.14 },
  { x: W * 0.28, y: H * 0.25 },
  { x: W * 0.72, y: H * 0.25 },
  { x: W * 0.18, y: H * 0.4 },
  { x: W * 0.82, y: H * 0.4 },
  { x: W * 0.5, y: H * 0.48 },
];

const STAGES = [
  { min: 0, max: 0, label: "SEED", color: "#8B6914" },
  { min: 1, max: 99, label: "SEEDLING", color: "#34d399" },
  { min: 100, max: 199, label: "SPROUT", color: "#00e87a" },
  { min: 200, max: 299, label: "SAPLING", color: "#00FF87" },
  { min: 300, max: 399, label: "GROWING", color: "#00FF87" },
  { min: 400, max: 449, label: "THRIVING", color: "#60a5fa" },
  { min: 450, max: 499, label: "ANCIENT", color: "#c084fc" },
  { min: 500, max: Infinity, label: "BLOOMED", color: "#c084fc" },
];

function getStage(xp) {
  return STAGES.find((s) => xp >= s.min && xp <= s.max) || STAGES[0];
}

const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

export default function BonsaiGrowthModel({
  totalXP = 0,
  bloomedDomains = [],
  maxXP = 500,
}) {
  // pct is always fresh — used directly for strokeDashoffset and label
  const pct = Math.min(totalXP / maxXP, 1);
  const pctDisplay = Math.round(pct * 100);
  const stage = getStage(totalXP);

  const cx = W / 2;
  const groundY = H - 28;
  const trunkH = 55 + pct * 85;
  const trunkTopY = groundY - trunkH;
  const trunkW = 8 + pct * 10;
  const canopyR = 28 + pct * 62;
  const branchSpan = 35 + pct * 70;

  const glowAnim = useRef(new Animated.Value(0)).current;
  const bloomPulse = useRef(new Animated.Value(0.85)).current;
  const leafSway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bloomPulse, {
          toValue: 1.15,
          duration: 1600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(bloomPulse, {
          toValue: 0.85,
          duration: 1600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(leafSway, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(leafSway, {
          toValue: -1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    ).start();
  }, []);

  const leafOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });
  const swayRotate = leafSway.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-2deg", "2deg"],
  });

  return (
    <View style={s.container}>
      {/* ── XP Ring — top right ─────────────────────────────── */}
      {/* Rendered as a View overlay, NOT inside SVG, so Text updates correctly */}
      <View style={s.xpRingWrap} pointerEvents="none">
        <Svg width={60} height={60} viewBox="0 0 60 60">
          {/* Track */}
          <Circle
            cx={30}
            cy={30}
            r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={4}
          />
          {/* Fill — strokeDashoffset uses direct pct so it re-renders on every XP change */}
          <Circle
            cx={30}
            cy={30}
            r={RING_R}
            fill="none"
            stroke={stage.color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${RING_C}`}
            strokeDashoffset={`${RING_C * (1 - pct)}`}
            transform="rotate(-90 30 30)"
          />
        </Svg>
        {/* Percentage label — native View/Text, always in sync */}
        <View style={s.ringLabelWrap}>
          <Text style={[s.ringPct, { color: stage.color }]}>{pctDisplay}%</Text>
        </View>
        {/* Label below ring */}
        <Text style={[s.ringPctLabel, { color: stage.color }]}>
          {pctDisplay}%
        </Text>
      </View>

      {/* ── Main SVG tree ────────────────────────────────────── */}
      <Animated.View
        style={[s.svgWrap, { transform: [{ rotate: swayRotate }] }]}
      >
        <Svg width={W} height={H}>
          {/* Ground glow */}
          <Ellipse
            cx={cx}
            cy={groundY + 6}
            rx={60 + pct * 30}
            ry={10}
            fill={`rgba(0,255,135,${0.04 + pct * 0.06})`}
          />
          <Ellipse
            cx={cx}
            cy={groundY + 4}
            rx={40 + pct * 20}
            ry={6}
            fill={`rgba(0,255,135,${0.06 + pct * 0.08})`}
          />

          {/* Seed */}
          {pct === 0 && (
            <G>
              <Ellipse
                cx={cx}
                cy={groundY - 10}
                rx={11}
                ry={15}
                fill="#5a3a1a"
              />
              <Ellipse
                cx={cx}
                cy={groundY - 10}
                rx={6}
                ry={9}
                fill="#7a5a2a"
                opacity={0.5}
              />
              <Path
                d={`M${cx},${groundY - 25} C${cx - 8},${groundY - 38} ${cx + 8},${groundY - 38} ${cx},${groundY - 25}`}
                stroke="#34d399"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={`M${cx},${groundY - 28} L${cx},${groundY - 42}`}
                stroke="#34d399"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </G>
          )}

          {/* Trunk */}
          {pct > 0 && (
            <G>
              <Path
                d={`M${cx - trunkW + 2},${groundY} C${cx - trunkW * 0.6 + 2},${trunkTopY + 30} ${cx + trunkW * 0.4 + 2},${trunkTopY + 20} ${cx + 2},${trunkTopY}`}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={trunkW + 2}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={`M${cx - trunkW},${groundY} C${cx - trunkW * 0.6},${trunkTopY + 30} ${cx + trunkW * 0.4},${trunkTopY + 20} ${cx},${trunkTopY}`}
                stroke="#5a3a1a"
                strokeWidth={trunkW}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={`M${cx - trunkW * 0.3},${groundY - 5} C${cx - trunkW * 0.2},${trunkTopY + 35} ${cx + trunkW * 0.1},${trunkTopY + 25} ${cx - trunkW * 0.15},${trunkTopY + 5}`}
                stroke="#7a5a2a"
                strokeWidth={trunkW * 0.4}
                fill="none"
                strokeLinecap="round"
                opacity={0.6}
              />
            </G>
          )}

          {/* Left branch */}
          {pct > 0.1 && (
            <G>
              <Path
                d={`M${cx},${trunkTopY + 22} C${cx - branchSpan * 0.45},${trunkTopY + 12} ${cx - branchSpan * 0.85},${trunkTopY - 4} ${cx - branchSpan},${trunkTopY - 16}`}
                stroke="#5a3a1a"
                strokeWidth={5 + pct * 3}
                fill="none"
                strokeLinecap="round"
              />
              {pct > 0.35 && (
                <Path
                  d={`M${cx - branchSpan * 0.5},${trunkTopY + 10} C${cx - branchSpan * 0.7},${trunkTopY - 4} ${cx - branchSpan * 0.9},${trunkTopY - 20} ${cx - branchSpan * 0.95},${trunkTopY - 32}`}
                  stroke="#5a3a1a"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </G>
          )}

          {/* Right branch */}
          {pct > 0.1 && (
            <G>
              <Path
                d={`M${cx},${trunkTopY + 16} C${cx + branchSpan * 0.45},${trunkTopY + 6} ${cx + branchSpan * 0.85},${trunkTopY - 10} ${cx + branchSpan},${trunkTopY - 22}`}
                stroke="#5a3a1a"
                strokeWidth={5 + pct * 3}
                fill="none"
                strokeLinecap="round"
              />
              {pct > 0.35 && (
                <Path
                  d={`M${cx + branchSpan * 0.5},${trunkTopY + 4} C${cx + branchSpan * 0.7},${trunkTopY - 10} ${cx + branchSpan * 0.85},${trunkTopY - 24} ${cx + branchSpan * 0.9},${trunkTopY - 38}`}
                  stroke="#5a3a1a"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </G>
          )}

          {/* Canopy */}
          {pct > 0.04 && (
            <G>
              <Ellipse
                cx={cx}
                cy={trunkTopY}
                rx={canopyR + 10}
                ry={canopyR * 0.62 + 6}
                fill={`rgba(0,80,40,${0.12 + pct * 0.1})`}
              />
              <Ellipse
                cx={cx - canopyR * 0.65}
                cy={trunkTopY + canopyR * 0.12}
                rx={canopyR * 0.52}
                ry={canopyR * 0.44}
                fill={`rgba(0,140,65,${0.2 + pct * 0.18})`}
              />
              <Ellipse
                cx={cx + canopyR * 0.65}
                cy={trunkTopY + canopyR * 0.08}
                rx={canopyR * 0.52}
                ry={canopyR * 0.44}
                fill={`rgba(0,140,65,${0.2 + pct * 0.18})`}
              />
              <Ellipse
                cx={cx}
                cy={trunkTopY}
                rx={canopyR}
                ry={canopyR * 0.68}
                fill={`rgba(0,160,75,${0.28 + pct * 0.2})`}
              />
              <Ellipse
                cx={cx - canopyR * 0.18}
                cy={trunkTopY - canopyR * 0.18}
                rx={canopyR * 0.38}
                ry={canopyR * 0.24}
                fill={`rgba(0,255,135,${0.06 + pct * 0.07})`}
              />
              <Ellipse
                cx={cx}
                cy={trunkTopY + canopyR * 0.1}
                rx={canopyR * 0.68}
                ry={canopyR * 0.5}
                fill={`rgba(0,180,85,${0.18 + pct * 0.14})`}
              />
            </G>
          )}

          {/* Domain blooms */}
          {bloomedDomains.map((domain, i) => {
            const pos = BLOOM_POSITIONS[i % BLOOM_POSITIONS.length];
            const color = DOMAIN_COLORS[domain] || "#00FF87";
            return (
              <G key={domain}>
                <Circle cx={pos.x} cy={pos.y} r={16} fill={`${color}18`} />
                <Circle cx={pos.x} cy={pos.y} r={11} fill={`${color}30`} />
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={7.5}
                  fill={color}
                  opacity={0.92}
                />
                <Circle
                  cx={pos.x - 2.5}
                  cy={pos.y - 2.5}
                  r={2.2}
                  fill="rgba(255,255,255,0.65)"
                />
                {[0, 60, 120, 180, 240, 300].map((angle) => {
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <Line
                      key={angle}
                      x1={pos.x + Math.cos(rad) * 8}
                      y1={pos.y + Math.sin(rad) * 8}
                      x2={pos.x + Math.cos(rad) * 14}
                      y2={pos.y + Math.sin(rad) * 14}
                      stroke={color}
                      strokeWidth={1.5}
                      opacity={0.5}
                      strokeLinecap="round"
                    />
                  );
                })}
              </G>
            );
          })}

          {/* XP particle dots */}
          {pct > 0.12 &&
            [0, 1, 2, 3].map((i) => {
              const angle = (i / 4) * Math.PI * 2;
              return (
                <Circle
                  key={`xp${i}`}
                  cx={cx + Math.cos(angle) * canopyR * 0.7 * 0.55}
                  cy={trunkTopY - canopyR * 0.25 - i * 9}
                  r={2 + (i % 2)}
                  fill={`rgba(0,255,135,${0.25 + (i % 3) * 0.1})`}
                />
              );
            })}
        </Svg>
      </Animated.View>

      {/* Stage badge + XP text */}
      <View style={s.stageBadgeRow}>
        <View
          style={[
            s.stagePill,
            {
              borderColor: `${stage.color}44`,
              backgroundColor: `${stage.color}14`,
            },
          ]}
        >
          <Text style={[s.stageTxt, { color: stage.color }]}>
            {stage.label}
          </Text>
        </View>
        <Text style={s.xpTxt}>
          {totalXP} / {maxXP} XP
        </Text>
      </View>

      {/* XP bar */}
      <View style={s.xpBarWrap}>
        <View style={s.xpBarTrack}>
          <View
            style={[
              s.xpBarFill,
              {
                width: `${pctDisplay}%`,
                backgroundColor: stage.color,
                shadowColor: stage.color,
                shadowOpacity: 0.6,
                shadowRadius: 8,
              },
            ]}
          />
        </View>
        {[100, 200, 300, 400].map((tick) => (
          <View
            key={tick}
            style={[s.tick, { left: `${(tick / maxXP) * 100}%` }]}
          />
        ))}
      </View>

      {/* Domain legend */}
      {bloomedDomains.length > 0 && (
        <View style={s.legend}>
          {bloomedDomains.map((d) => (
            <View key={d} style={s.legendItem}>
              <View
                style={[s.legendDot, { backgroundColor: DOMAIN_COLORS[d] }]}
              />
              <Text style={[s.legendTxt, { color: DOMAIN_COLORS[d] }]}>
                {d}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: "rgba(0,255,135,0.025)",
    borderWidth: 1,
    borderColor: "rgba(0,255,135,0.12)",
    overflow: "hidden",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 14,
  },

  // Ring — absolute top-right, contains SVG + overlay Text
  xpRingWrap: {
    position: "absolute",
    top: 10,
    right: 14,
    alignItems: "center",
  },
  // The percentage text sits centred over the SVG ring using absolute positioning
  ringLabelWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 18, // bottom: 18 accounts for the label below
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  ringPctLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  svgWrap: { alignItems: "center" },

  stageBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  stagePill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  stageTxt: { fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  xpTxt: { fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "600" },

  xpBarWrap: { width: "88%", position: "relative", marginBottom: 6 },
  xpBarTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: { height: "100%", borderRadius: 4 },
  tick: {
    position: "absolute",
    top: -2,
    width: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendTxt: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
});
