// screens/OnboardingScreen.js — 1Life Hub
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Circle, Ellipse, G } from "react-native-svg";

const { width, height } = Dimensions.get("window");
const BG = "#130101";
const GREEN = "#00B85C";
const BLUE = "#441FFF";
const RED = "#E8001C";
const ORANGE = "#FF4B0A";
const WHITE = "#FFFFFF";

const SLIDES = [
  {
    id: 0,
    title: "Welcome to\n1Life Hub",
    sub: "Your personal growth tracker.\nBuilt around your life.",
    accent: GREEN,
    plantXP: 0,
  },
  {
    id: 1,
    title: "Build Daily\nHabits",
    sub: "Log your habits every day.\nEach one feeds your plant.",
    accent: GREEN,
    plantXP: 150,
  },
  {
    id: 2,
    title: "Track Health\n& Goals",
    sub: "Log sleep, water and movement.\nSet goals across every area.",
    accent: RED,
    plantXP: 350,
  },
  {
    id: 3,
    title: "Watch\nYourself Grow",
    sub: "Your plant reflects your progress\nacross every area of life.",
    accent: BLUE,
    plantXP: 500,
  },
];

function PlantStage({ xp, accent }) {
  const W = width * 0.65;
  const H = 200;
  const pct = Math.min(xp / 500, 1);
  const cx = W / 2;
  const gY = H - 16;
  const tH = 36 + pct * 72;
  const tTY = gY - tH;
  const cR = 18 + pct * 50;
  const bS = 26 + pct * 50;

  return (
    <Svg width={W} height={H}>
      <Ellipse
        cx={cx}
        cy={gY + 5}
        rx={42 + pct * 22}
        ry={8}
        fill={`${GREEN}20`}
      />
      {pct === 0 && (
        <G>
          <Ellipse cx={cx} cy={gY - 8} rx={9} ry={12} fill="#3d2a10" />
          <Path
            d={`M${cx},${gY - 20} C${cx - 6},${gY - 30} ${cx + 6},${gY - 30} ${cx},${gY - 20}`}
            stroke={GREEN}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M${cx},${gY - 22} L${cx},${gY - 34}`}
            stroke={GREEN}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>
      )}
      {pct > 0 && (
        <G>
          <Path
            d={`M${cx - 5},${gY} C${cx - 3},${tTY + 24} ${cx + 3},${tTY + 16} ${cx},${tTY}`}
            stroke="#3d2a10"
            strokeWidth={7 + pct * 7}
            fill="none"
            strokeLinecap="round"
          />
        </G>
      )}
      {pct > 0.1 && (
        <G>
          <Path
            d={`M${cx},${tTY + 18} C${cx - bS * 0.4},${tTY + 10} ${cx - bS * 0.8},${tTY - 3} ${cx - bS},${tTY - 14}`}
            stroke="#3d2a10"
            strokeWidth={4 + pct * 2}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M${cx},${tTY + 13} C${cx + bS * 0.4},${tTY + 5} ${cx + bS * 0.8},${tTY - 8} ${cx + bS},${tTY - 18}`}
            stroke="#3d2a10"
            strokeWidth={4 + pct * 2}
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
            rx={cR + 8}
            ry={cR * 0.58 + 4}
            fill={`rgba(0,80,40,0.15)`}
          />
          <Ellipse
            cx={cx - cR * 0.6}
            cy={tTY + cR * 0.1}
            rx={cR * 0.48}
            ry={cR * 0.4}
            fill={`rgba(0,140,65,${0.18 + pct * 0.15})`}
          />
          <Ellipse
            cx={cx + cR * 0.6}
            cy={tTY + cR * 0.07}
            rx={cR * 0.48}
            ry={cR * 0.4}
            fill={`rgba(0,140,65,${0.18 + pct * 0.15})`}
          />
          <Ellipse
            cx={cx}
            cy={tTY}
            rx={cR}
            ry={cR * 0.65}
            fill={`rgba(0,160,75,${0.25 + pct * 0.18})`}
          />
          <Ellipse
            cx={cx}
            cy={tTY}
            rx={cR * 0.6}
            ry={cR * 0.45}
            fill={`rgba(0,184,92,${0.2 + pct * 0.15})`}
          />
        </G>
      )}
      {xp >= 150 && (
        <Circle
          cx={cx - cR * 0.3}
          cy={tTY - cR * 0.3}
          r={5}
          fill={GREEN}
          opacity={0.9}
        />
      )}
      {xp >= 300 && (
        <Circle
          cx={cx + cR * 0.5}
          cy={tTY - cR * 0.15}
          r={4}
          fill={BLUE}
          opacity={0.9}
        />
      )}
      {xp >= 400 && (
        <Circle
          cx={cx - cR * 0.1}
          cy={tTY - cR * 0.55}
          r={3.5}
          fill={ORANGE}
          opacity={0.85}
        />
      )}
      {xp >= 500 && (
        <Circle
          cx={cx + cR * 0.2}
          cy={tTY + cR * 0.2}
          r={4}
          fill={RED}
          opacity={0.9}
        />
      )}
    </Svg>
  );
}

export default function OnboardingScreen({ onDone }) {
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const next = async () => {
    if (idx < SLIDES.length - 1) {
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setIdx((i) => i + 1));
    } else {
      await AsyncStorage.setItem("onboarding_done", "true");
      onDone();
    }
  };

  const slide = SLIDES[idx];
  const accent = slide.accent;

  return (
    <SafeAreaView
      style={[ob.root, { backgroundColor: BG }]}
      edges={["top", "bottom"]}
    >
      {/* Accent block — top portion */}
      <View style={[ob.accentBlock, { backgroundColor: accent }]}>
        <Animated.View style={[ob.plantWrap, { opacity: fade }]}>
          <PlantStage xp={slide.plantXP} accent={accent} />
        </Animated.View>
      </View>

      {/* Content area */}
      <Animated.View style={[ob.content, { opacity: fade }]}>
        <Text style={ob.title}>{slide.title}</Text>
        <Text style={ob.sub}>{slide.sub}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={ob.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              ob.dot,
              i === idx && [ob.dotActive, { backgroundColor: accent }],
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={ob.footer}>
        <TouchableOpacity
          style={[ob.btn, { backgroundColor: accent }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={[ob.btnTxt, { color: accent === GREEN ? BG : WHITE }]}>
            {idx < SLIDES.length - 1 ? "NEXT" : "GET STARTED"}
          </Text>
        </TouchableOpacity>
        {idx < SLIDES.length - 1 && (
          <TouchableOpacity
            onPress={async () => {
              await AsyncStorage.setItem("onboarding_done", "true");
              onDone();
            }}
            style={ob.skip}
          >
            <Text style={ob.skipTxt}>SKIP</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const ob = StyleSheet.create({
  root: { flex: 1 },
  accentBlock: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    overflow: "hidden",
  },
  plantWrap: { alignItems: "center" },
  content: { paddingHorizontal: 28, paddingTop: 32, flex: 1 },
  title: {
    fontSize: 36,
    fontFamily: "Orbitron",
    color: WHITE,
    letterSpacing: 1,
    lineHeight: 42,
    marginBottom: 14,
  },
  sub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 24,
    fontWeight: "400",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: { width: 24, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  btn: { borderRadius: 18, paddingVertical: 18, alignItems: "center" },
  btnTxt: { fontSize: 15, fontWeight: "900", letterSpacing: 2 },
  skip: { alignItems: "center", paddingVertical: 6 },
  skipTxt: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "700",
    letterSpacing: 2,
  },
});
