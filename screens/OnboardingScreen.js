// screens/OnboardingScreen.js — 1Life Hub
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle, Ellipse, G } from "react-native-svg";

const { width } = Dimensions.get("window");

const BG = "#0A0E27";
const RED = "#CC0000";
const BLUE = "#0047AB";
const GREEN = "#00C060";
const ORANGE = "#FF4B0A";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.55)";
const DIM = "rgba(255,255,255,0.80)";

// ── SLIDES ────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 0,
    icon: "leaf-outline",
    accent: GREEN,
    title: "Welcome to\n1Life Hub",
    sub: "One app to track every area of your life — health, routine, and habits — all in one place.",
    steps: null,
    plantXP: 0,
  },
  {
    id: 1,
    icon: "heart-outline",
    accent: RED,
    title: "Track Your\nPhysical Health",
    sub: "Log your daily health metrics and hit your goals every day.",
    steps: [
      {
        icon: "moon-outline",
        color: BLUE,
        text: "Sleep — log 8 hours a night",
      },
      {
        icon: "water-outline",
        color: BLUE,
        text: "Water — aim for 8 glasses a day",
      },
      {
        icon: "barbell-outline",
        color: RED,
        text: "Movement — hit 60 active minutes",
      },
    ],
    plantXP: 150,
  },
  {
    id: 2,
    icon: "list-outline",
    accent: BLUE,
    title: "Manage Your\nRoutine",
    sub: "Stay on top of everything you need to do each day.",
    steps: [
      {
        icon: "calendar-outline",
        color: BLUE,
        text: "Meetings — log upcoming meetings",
      },
      {
        icon: "alarm-outline",
        color: ORANGE,
        text: "Deadlines — never miss a due date",
      },
      {
        icon: "checkmark-done-outline",
        color: GREEN,
        text: "Tasks — tick off your to-do list",
      },
    ],
    plantXP: 300,
  },
  {
    id: 3,
    icon: "trophy-outline",
    accent: GREEN,
    title: "Grow Every\nSingle Day",
    sub: "Your progress feeds a living plant. The more you do, the more it grows.",
    steps: [
      {
        icon: "flash-outline",
        color: GREEN,
        text: "Earn XP by completing daily goals",
      },
      {
        icon: "trending-up-outline",
        color: BLUE,
        text: "Watch your plant grow over time",
      },
      {
        icon: "star-outline",
        color: ORANGE,
        text: "Build streaks — stay consistent",
      },
    ],
    plantXP: 500,
  },
];

// ── MINI PLANT ────────────────────────────────────────────────
function MiniPlant({ xp }) {
  const W = 100;
  const H = 100;
  const pct = Math.min(xp / 500, 1);
  const cx = W / 2;
  const gY = H - 10;
  const tH = 20 + pct * 45;
  const tTY = gY - tH;
  const cR = 10 + pct * 28;
  const bS = 14 + pct * 30;

  return (
    <Svg width={W} height={H}>
      <Ellipse
        cx={cx}
        cy={gY + 3}
        rx={22 + pct * 14}
        ry={5}
        fill={`${GREEN}25`}
      />
      {pct === 0 && (
        <G>
          <Ellipse cx={cx} cy={gY - 5} rx={5} ry={7} fill="#3d2a10" />
          <Path
            d={`M${cx},${gY - 12} L${cx},${gY - 20}`}
            stroke={GREEN}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>
      )}
      {pct > 0 && (
        <Path
          d={`M${cx},${gY} C${cx - 2},${tTY + 14} ${cx + 2},${tTY + 8} ${cx},${tTY}`}
          stroke="#3d2a10"
          strokeWidth={4 + pct * 5}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {pct > 0.1 && (
        <G>
          <Path
            d={`M${cx},${tTY + 10} C${cx - bS * 0.4},${tTY + 4} ${cx - bS * 0.8},${tTY - 2} ${cx - bS},${tTY - 8}`}
            stroke="#3d2a10"
            strokeWidth={2 + pct}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M${cx},${tTY + 8} C${cx + bS * 0.4},${tTY + 2} ${cx + bS * 0.8},${tTY - 5} ${cx + bS},${tTY - 10}`}
            stroke="#3d2a10"
            strokeWidth={2 + pct}
            fill="none"
            strokeLinecap="round"
          />
        </G>
      )}
      {pct > 0.04 && (
        <G>
          <Ellipse
            cx={cx}
            cy={tTY}
            rx={cR + 4}
            ry={cR * 0.58 + 2}
            fill="rgba(0,80,40,0.15)"
          />
          <Ellipse
            cx={cx - cR * 0.6}
            cy={tTY + cR * 0.1}
            rx={cR * 0.48}
            ry={cR * 0.4}
            fill={`rgba(0,140,65,${0.2 + pct * 0.15})`}
          />
          <Ellipse
            cx={cx + cR * 0.6}
            cy={tTY + cR * 0.07}
            rx={cR * 0.48}
            ry={cR * 0.4}
            fill={`rgba(0,140,65,${0.2 + pct * 0.15})`}
          />
          <Ellipse
            cx={cx}
            cy={tTY}
            rx={cR}
            ry={cR * 0.65}
            fill={`rgba(0,160,75,${0.28 + pct * 0.18})`}
          />
          <Ellipse
            cx={cx}
            cy={tTY}
            rx={cR * 0.6}
            ry={cR * 0.45}
            fill={`rgba(0,192,96,${0.22 + pct * 0.15})`}
          />
        </G>
      )}
      {xp >= 150 && (
        <Circle
          cx={cx - cR * 0.3}
          cy={tTY - cR * 0.3}
          r={3}
          fill={GREEN}
          opacity={0.9}
        />
      )}
      {xp >= 300 && (
        <Circle
          cx={cx + cR * 0.5}
          cy={tTY - cR * 0.15}
          r={2.5}
          fill={BLUE}
          opacity={0.9}
        />
      )}
      {xp >= 500 && (
        <Circle
          cx={cx + cR * 0.2}
          cy={tTY + cR * 0.2}
          r={2.5}
          fill={RED}
          opacity={0.9}
        />
      )}
    </Svg>
  );
}

// ── MAIN ─────────────────────────────────────────────────────
export default function OnboardingScreen({ onDone }) {
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const goTo = (next) => {
    Animated.sequence([
      Animated.timing(fade, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setIdx(next));
  };

  const handleNext = async () => {
    if (idx < SLIDES.length - 1) {
      goTo(idx + 1);
    } else {
      await AsyncStorage.setItem("onboarding_done", "true");
      onDone();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("onboarding_done", "true");
    onDone();
  };

  const slide = SLIDES[idx];
  const accent = slide.accent;
  const isLast = idx === SLIDES.length - 1;

  return (
    <SafeAreaView style={ob.root} edges={["top", "bottom"]}>
      {/* ── HEADER ICON + PLANT ── */}
      <Animated.View style={[ob.topBlock, { opacity: fade }]}>
        <View
          style={[
            ob.iconRing,
            { backgroundColor: `${accent}22`, borderColor: `${accent}55` },
          ]}
        >
          <Ionicons name={slide.icon} size={32} color={accent} />
        </View>
        <View style={ob.plantWrap}>
          <MiniPlant xp={slide.plantXP} />
          <View
            style={[
              ob.xpPill,
              { backgroundColor: `${accent}22`, borderColor: `${accent}44` },
            ]}
          >
            <Ionicons name="flash-outline" size={11} color={accent} />
            <Text style={[ob.xpTxt, { color: accent }]}>
              {slide.plantXP} / 500 XP
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── CONTENT ── */}
      <Animated.View style={[ob.content, { opacity: fade }]}>
        <View style={[ob.accentLine, { backgroundColor: accent }]} />
        <Text style={ob.title}>{slide.title}</Text>
        <Text style={ob.sub}>{slide.sub}</Text>

        {/* Step cards */}
        {slide.steps && (
          <View style={ob.steps}>
            {slide.steps.map((step, i) => (
              <View key={i} style={ob.stepRow}>
                <View
                  style={[ob.stepIcon, { backgroundColor: `${step.color}22` }]}
                >
                  <Ionicons name={step.icon} size={18} color={step.color} />
                </View>
                <Text style={ob.stepTxt}>{step.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Welcome screen — show how the app works */}
        {idx === 0 && (
          <View style={ob.steps}>
            {[
              {
                icon: "heart-outline",
                color: RED,
                text: "Physical — track sleep, water & movement",
              },
              {
                icon: "list-outline",
                color: BLUE,
                text: "Routine — manage tasks, meetings & deadlines",
              },
              {
                icon: "leaf-outline",
                color: GREEN,
                text: "Habits — build streaks and earn XP daily",
              },
            ].map((item, i) => (
              <View key={i} style={ob.stepRow}>
                <View
                  style={[ob.stepIcon, { backgroundColor: `${item.color}22` }]}
                >
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={ob.stepTxt}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* ── DOTS ── */}
      <View style={ob.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View
              style={[
                ob.dot,
                i === idx
                  ? [ob.dotActive, { backgroundColor: accent }]
                  : { backgroundColor: "rgba(255,255,255,0.20)" },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── FOOTER ── */}
      <View style={ob.footer}>
        <TouchableOpacity
          style={[ob.btn, { backgroundColor: accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={ob.btnTxt}>{isLast ? "GET STARTED" : "NEXT"}</Text>
          <Ionicons
            name={isLast ? "checkmark-outline" : "arrow-forward-outline"}
            size={18}
            color={WHITE}
          />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleSkip} style={ob.skip}>
            <Text style={ob.skipTxt}>SKIP INTRO</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const ob = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // Top visual block
  topBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  plantWrap: {
    alignItems: "center",
    gap: 6,
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  xpTxt: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  accentLine: {
    width: 36,
    height: 3,
    borderRadius: 2,
    marginBottom: 14,
  },
  title: {
    fontSize: 32,
    fontFamily: "Orbitron",
    color: WHITE,
    letterSpacing: 0.5,
    lineHeight: 40,
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: DIM,
    lineHeight: 24,
    fontWeight: "400",
    marginBottom: 24,
  },

  // Steps
  steps: {
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepTxt: {
    fontSize: 14,
    color: WHITE,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },

  // Dots
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: 4,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 10,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnTxt: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: WHITE,
  },
  skip: {
    alignItems: "center",
    paddingVertical: 6,
  },
  skipTxt: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
