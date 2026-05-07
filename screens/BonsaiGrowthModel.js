// ─────────────────────────────────────────────────────────────
// screens/BonsaiGrowthModel.js  —  1Life Hub
// Dramatically improved bonsai with clear visual growth stages,
// animated transitions, pulsing blooms, and XP ring indicator
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  Defs,
  RadialGradient,
  Stop,
  Line,
} from "react-native-svg";
import { COLORS } from "../constants/colors"; // ✅ named import
const { width } = Dimensions.get("window");
const W = width - 28;
const H = 260;

const DOMAIN_COLORS = {
  physical: COLORS.domains.physical,
  mental: COLORS.domains.mental,
  financial: COLORS.domains.financial,
  spiritual: COLORS.domains.spiritual,
  emotional: COLORS.domains.emotional,
  personal: "#34d399",
};

// Six bloom positions distributed around the canopy
const BLOOM_POSITIONS = [
  { x: W * 0.5, y: H * 0.14 }, // apex
  { x: W * 0.28, y: H * 0.25 }, // upper-left
  { x: W * 0.72, y: H * 0.25 }, // upper-right
  { x: W * 0.18, y: H * 0.4 }, // mid-left
  { x: W * 0.82, y: H * 0.4 }, // mid-right
  { x: W * 0.5, y: H * 0.48 }, // lower-centre
];

// Growth stage definitions — what changes visibly at each threshold
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

export default function BonsaiGrowthModel({
  totalXP = 0,
  bloomedDomains = [],
  maxXP = 500,
}) {
  const pct = Math.min(totalXP / maxXP, 1);
  const stage = getStage(totalXP);

  // Geometry — scale smoothly with XP
  const cx = W / 2;
  const groundY = H - 28;
  const trunkH = 55 + pct * 85; // 55 → 140
  const trunkTopY = groundY - trunkH;
  const trunkW = 8 + pct * 10; // 8 → 18
  const canopyR = 28 + pct * 62; // 28 → 90
  const branchSpan = 35 + pct * 70; // 35 → 105

  // Animations
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bloomPulse = useRef(new Animated.Value(0.85)).current;
  const leafSway = useRef(new Animated.Value(0)).current;
  const xpRingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Glow pulse
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

    // Bloom pulse — slightly offset
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

    // Gentle leaf sway
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

    // XP ring fill animation on mount/update
    xpRingAnim.setValue(0);
    Animated.timing(xpRingAnim, {
      toValue: pct,
      duration: 1200,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [totalXP]);

  // Circumference for XP ring
  const RING_R = 26;
  const RING_C = 2 * Math.PI * RING_R;

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
      {/* XP Progress ring — top right */}
      <View style={s.xpRingWrap}>
        <Svg width={60} height={60} viewBox="0 0 60 60">
          <Circle
            cx={30}
            cy={30}
            r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={4}
          />
          <Circle
            cx={30}
            cy={30}
            r={RING_R}
            fill="none"
            stroke={stage.color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - pct)}
            transform="rotate(-90 30 30)"
          />
          <Text style={[s.ringPct, { color: stage.color }]}>
            {Math.round(pct * 100)}%
          </Text>
        </Svg>
        <Text style={[s.ringPctLabel, { color: stage.color }]}>
          {Math.round(pct * 100)}%
        </Text>
      </View>

      {/* Main SVG tree */}
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

          {/* ── SEED stage (pct === 0) ── */}
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
              {/* Tiny sprout lines */}
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

          {/* ── TRUNK (visible once pct > 0) ── */}
          {pct > 0 && (
            <G>
              {/* Trunk shadow */}
              <Path
                d={`M${cx - trunkW + 2},${groundY} C${cx - trunkW * 0.6 + 2},${trunkTopY + 30} ${cx + trunkW * 0.4 + 2},${trunkTopY + 20} ${cx + 2},${trunkTopY}`}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={trunkW + 2}
                fill="none"
                strokeLinecap="round"
              />
              {/* Main trunk */}
              <Path
                d={`M${cx - trunkW},${groundY} C${cx - trunkW * 0.6},${trunkTopY + 30} ${cx + trunkW * 0.4},${trunkTopY + 20} ${cx},${trunkTopY}`}
                stroke="#5a3a1a"
                strokeWidth={trunkW}
                fill="none"
                strokeLinecap="round"
              />
              {/* Trunk highlight */}
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

          {/* ── LEFT BRANCH ── */}
          {pct > 0.1 && (
            <G>
              <Path
                d={`M${cx},${trunkTopY + 22} C${cx - branchSpan * 0.45},${trunkTopY + 12} ${cx - branchSpan * 0.85},${trunkTopY - 4} ${cx - branchSpan},${trunkTopY - 16}`}
                stroke="#5a3a1a"
                strokeWidth={5 + pct * 3}
                fill="none"
                strokeLinecap="round"
              />
              {/* Left sub-branch */}
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

          {/* ── RIGHT BRANCH ── */}
          {pct > 0.1 && (
            <G>
              <Path
                d={`M${cx},${trunkTopY + 16} C${cx + branchSpan * 0.45},${trunkTopY + 6} ${cx + branchSpan * 0.85},${trunkTopY - 10} ${cx + branchSpan},${trunkTopY - 22}`}
                stroke="#5a3a1a"
                strokeWidth={5 + pct * 3}
                fill="none"
                strokeLinecap="round"
              />
              {/* Right sub-branch */}
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

          {/* ── CANOPY LAYERS (build up with pct) ── */}
          {pct > 0.04 && (
            <Animated.View style={{ opacity: leafOpacity }}>
              <G>
                {/* Outer glow shadow */}
                <Ellipse
                  cx={cx}
                  cy={trunkTopY}
                  rx={canopyR + 10}
                  ry={canopyR * 0.62 + 6}
                  fill={`rgba(0,80,40,${0.12 + pct * 0.1})`}
                />
                {/* Left cloud */}
                <Ellipse
                  cx={cx - canopyR * 0.65}
                  cy={trunkTopY + canopyR * 0.12}
                  rx={canopyR * 0.52}
                  ry={canopyR * 0.44}
                  fill={`rgba(0,140,65,${0.2 + pct * 0.18})`}
                />
                {/* Right cloud */}
                <Ellipse
                  cx={cx + canopyR * 0.65}
                  cy={trunkTopY + canopyR * 0.08}
                  rx={canopyR * 0.52}
                  ry={canopyR * 0.44}
                  fill={`rgba(0,140,65,${0.2 + pct * 0.18})`}
                />
                {/* Main dome */}
                <Ellipse
                  cx={cx}
                  cy={trunkTopY}
                  rx={canopyR}
                  ry={canopyR * 0.68}
                  fill={`rgba(0,160,75,${0.28 + pct * 0.2})`}
                />
                {/* Top cap highlight */}
                <Ellipse
                  cx={cx - canopyR * 0.18}
                  cy={trunkTopY - canopyR * 0.18}
                  rx={canopyR * 0.38}
                  ry={canopyR * 0.24}
                  fill={`rgba(0,255,135,${0.06 + pct * 0.07})`}
                />
                {/* Dense centre */}
                <Ellipse
                  cx={cx}
                  cy={trunkTopY + canopyR * 0.1}
                  rx={canopyR * 0.68}
                  ry={canopyR * 0.5}
                  fill={`rgba(0,180,85,${0.18 + pct * 0.14})`}
                />
              </G>
            </Animated.View>
          )}

          {/* ── DOMAIN BLOOMS ── */}
          {bloomedDomains.map((domain, i) => {
            const pos = BLOOM_POSITIONS[i % BLOOM_POSITIONS.length];
            const color = DOMAIN_COLORS[domain] || "#00FF87";
            return (
              <G key={domain}>
                {/* Outer glow ring */}
                <Circle cx={pos.x} cy={pos.y} r={16} fill={`${color}18`} />
                {/* Mid glow */}
                <Circle cx={pos.x} cy={pos.y} r={11} fill={`${color}30`} />
                {/* Core bloom */}
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={7.5}
                  fill={color}
                  opacity={0.92}
                />
                {/* Shine */}
                <Circle
                  cx={pos.x - 2.5}
                  cy={pos.y - 2.5}
                  r={2.2}
                  fill="rgba(255,255,255,0.65)"
                />
                {/* Petal lines */}
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

          {/* ── XP PARTICLE DOTS (floating above canopy) ── */}
          {pct > 0.12 &&
            [0, 1, 2, 3].map((i) => {
              const angle = (i / 4) * Math.PI * 2;
              const r = canopyR * 0.55;
              return (
                <Circle
                  key={`xp${i}`}
                  cx={cx + Math.cos(angle) * r * 0.7}
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

      {/* XP bar — wide, prominent */}
      <View style={s.xpBarWrap}>
        <View style={s.xpBarTrack}>
          <Animated.View
            style={[
              s.xpBarFill,
              {
                width: `${Math.round(pct * 100)}%`,
                backgroundColor: stage.color,
                shadowColor: stage.color,
                shadowOpacity: 0.6,
                shadowRadius: 8,
              },
            ]}
          />
        </View>
        {/* Milestone ticks */}
        {[100, 200, 300, 400].map((tick) => (
          <View
            key={tick}
            style={[s.tick, { left: `${(tick / maxXP) * 100}%` }]}
          />
        ))}
      </View>

      {/* Domain bloom legend */}
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
  xpRingWrap: {
    position: "absolute",
    top: 10,
    right: 14,
    alignItems: "center",
  },
  ringPctLabel: {
    fontSize: 9,
    fontWeight: "900",
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
  xpTxt: { fontSize: 10, color: "#44445a", fontWeight: "600" },

  xpBarWrap: {
    width: "88%",
    position: "relative",
    marginBottom: 6,
  },
  xpBarTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 4,
  },
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
