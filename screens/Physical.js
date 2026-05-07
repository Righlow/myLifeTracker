// ─────────────────────────────────────────────────────────────
// screens/Physical.js  —  1Life Hub
// Sub-tabs: Sleep | Diet | Gym  +  fan FAB menu
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { healthStore } from "../store";
import { COLORS } from "../constants/colors";

const GREEN = COLORS.neonGreen;
const RED = COLORS.neonRed;
const MUTED = COLORS.textMuted;

// ── Sub tabs ──────────────────────────────────────────────────
const TABS = [
  { key: "sleep", label: "Sleep" },
  { key: "diet", label: "Diet" },
  { key: "gym", label: "Gym" },
];

// ── Fan FAB ───────────────────────────────────────────────────
function FanFAB({ onLogSleep, onLogDiet, onLogGym }) {
  const [open, setOpen] = useState(false);

  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity1 = useRef(new Animated.Value(0)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const opacity3 = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(rotate, { toValue, useNativeDriver: true, speed: 20 }),
      Animated.spring(anim1, {
        toValue,
        useNativeDriver: true,
        speed: 18,
        delay: 0,
      }),
      Animated.spring(anim2, {
        toValue,
        useNativeDriver: true,
        speed: 18,
        delay: 40,
      }),
      Animated.spring(anim3, {
        toValue,
        useNativeDriver: true,
        speed: 18,
        delay: 80,
      }),
      Animated.timing(opacity1, {
        toValue,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity2, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity3, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
    setOpen(!open);
  };

  const close = () => {
    if (open) toggle();
  };

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const FanItem = ({ anim, opacity, label, onPress, icon }) => (
    <Animated.View
      style={[
        p.fanItem,
        {
          opacity,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -1],
              }),
            },
          ],
          bottom: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        },
      ]}
    >
      <Animated.View
        style={{ opacity, flexDirection: "row", alignItems: "center", gap: 10 }}
      >
        <Text style={p.fanLabel}>{label}</Text>
        <TouchableOpacity
          style={p.fanBtn}
          onPress={() => {
            close();
            onPress();
          }}
          activeOpacity={0.8}
        >
          <Text style={p.fanIcon}>{icon}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  return (
    <View style={p.fabWrap} pointerEvents="box-none">
      {/* Fan items */}
      <Animated.View
        style={[
          p.fanStack,
          {
            bottom: anim1.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 70],
            }),
          },
        ]}
      >
        <FanItem
          anim={anim1}
          opacity={opacity1}
          label="Log Sleep"
          icon="🌙"
          onPress={onLogSleep}
        />
      </Animated.View>
      <Animated.View
        style={[
          p.fanStack,
          {
            bottom: anim2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 130],
            }),
          },
        ]}
      >
        <FanItem
          anim={anim2}
          opacity={opacity2}
          label="Log Diet"
          icon="🥗"
          onPress={onLogDiet}
        />
      </Animated.View>
      <Animated.View
        style={[
          p.fanStack,
          {
            bottom: anim3.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 190],
            }),
          },
        ]}
      >
        <FanItem
          anim={anim3}
          opacity={opacity3}
          label="Log Gym"
          icon="💪"
          onPress={onLogGym}
        />
      </Animated.View>

      {/* Main FAB */}
      <TouchableOpacity style={p.fab} onPress={toggle} activeOpacity={0.85}>
        <Animated.Text style={[p.fabIcon, { transform: [{ rotate: spin }] }]}>
          ＋
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Sleep Tab ─────────────────────────────────────────────────
function SleepTab({ sleep, setSleep, save }) {
  const pct = Math.min((sleep / 8) * 100, 100);
  const atGoal = sleep >= 8;

  return (
    <View style={p.tabContent}>
      <View style={p.metricCard}>
        <View style={p.metricHeader}>
          <Text style={p.metricTitle}>Hours slept</Text>
          <View
            style={[
              p.valuePill,
              { borderColor: atGoal ? `${GREEN}40` : "rgba(255,255,255,0.1)" },
            ]}
          >
            <Text style={[p.valueNum, { color: atGoal ? GREEN : COLORS.text }]}>
              {sleep % 1 === 0 ? sleep : sleep.toFixed(1)}
            </Text>
            <Text style={p.valueUnit}> hrs</Text>
          </View>
        </View>
        <Slider
          style={p.slider}
          minimumValue={0}
          maximumValue={12}
          step={0.5}
          value={sleep}
          onValueChange={setSleep}
          onSlidingComplete={(v) => save({ sleep: v })}
          minimumTrackTintColor={atGoal ? GREEN : "rgba(255,255,255,0.3)"}
          maximumTrackTintColor="rgba(255,255,255,0.07)"
          thumbTintColor={atGoal ? GREEN : COLORS.text}
        />
        <View style={p.metricFooter}>
          <Text style={p.tip}>Aim for 7–9 hours</Text>
          {atGoal && (
            <Text style={[p.goalBadge, { color: GREEN }]}>Goal hit ✓</Text>
          )}
        </View>
        <View style={p.track}>
          <View
            style={[
              p.fill,
              {
                width: `${pct}%`,
                backgroundColor: atGoal ? GREEN : "rgba(255,255,255,0.2)",
              },
            ]}
          />
        </View>
      </View>

      {/* Sleep tips */}
      <View style={p.tipsCard}>
        <Text style={p.tipsTitle}>SLEEP TIPS</Text>
        {[
          "No screens 1hr before bed",
          "Keep room cool and dark",
          "Same sleep time every night",
        ].map((t, i) => (
          <View key={i} style={p.tipRow}>
            <View style={[p.tipDot, { backgroundColor: GREEN }]} />
            <Text style={p.tipTxt}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Diet Tab ──────────────────────────────────────────────────
function DietTab({ water, setWater, save }) {
  const pct = Math.min((water / 8) * 100, 100);
  const atGoal = water >= 8;

  const meals = ["Breakfast", "Lunch", "Dinner", "Snacks"];
  const [logged, setLogged] = useState({});

  return (
    <View style={p.tabContent}>
      {/* Water tracker */}
      <View style={p.metricCard}>
        <View style={p.metricHeader}>
          <Text style={p.metricTitle}>Water intake</Text>
          <View
            style={[
              p.valuePill,
              { borderColor: atGoal ? `${GREEN}40` : "rgba(255,255,255,0.1)" },
            ]}
          >
            <Text style={[p.valueNum, { color: atGoal ? GREEN : COLORS.text }]}>
              {water}
            </Text>
            <Text style={p.valueUnit}> gl</Text>
          </View>
        </View>
        <Slider
          style={p.slider}
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={water}
          onValueChange={setWater}
          onSlidingComplete={(v) => save({ water: v })}
          minimumTrackTintColor={atGoal ? GREEN : "rgba(255,255,255,0.3)"}
          maximumTrackTintColor="rgba(255,255,255,0.07)"
          thumbTintColor={atGoal ? GREEN : COLORS.text}
        />
        <View style={p.metricFooter}>
          <Text style={p.tip}>Aim for 8 glasses</Text>
          {atGoal && (
            <Text style={[p.goalBadge, { color: GREEN }]}>Goal hit ✓</Text>
          )}
        </View>
        <View style={p.track}>
          <View
            style={[
              p.fill,
              {
                width: `${pct}%`,
                backgroundColor: atGoal ? GREEN : "rgba(255,255,255,0.2)",
              },
            ]}
          />
        </View>
      </View>

      {/* Meal checklist */}
      <View style={p.tipsCard}>
        <Text style={p.tipsTitle}>MEALS TODAY</Text>
        {meals.map((meal) => (
          <TouchableOpacity
            key={meal}
            style={p.mealRow}
            onPress={() =>
              setLogged((prev) => ({ ...prev, [meal]: !prev[meal] }))
            }
            activeOpacity={0.7}
          >
            <View
              style={[
                p.mealCheck,
                logged[meal] && { backgroundColor: GREEN, borderColor: GREEN },
              ]}
            >
              {logged[meal] && <Text style={p.mealTick}>✓</Text>}
            </View>
            <Text
              style={[
                p.mealLabel,
                logged[meal] && {
                  color: GREEN,
                  opacity: 0.6,
                  textDecorationLine: "line-through",
                },
              ]}
            >
              {meal}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Gym Tab ───────────────────────────────────────────────────
function GymTab({ movement, setMovement, save }) {
  const pct = Math.min((movement / 60) * 100, 100);
  const atGoal = movement >= 60;

  const workouts = ["Cardio", "Strength", "Flexibility", "Sports", "Walk"];
  const [selected, setSelected] = useState(null);

  return (
    <View style={p.tabContent}>
      {/* Movement slider */}
      <View style={p.metricCard}>
        <View style={p.metricHeader}>
          <Text style={p.metricTitle}>Active minutes</Text>
          <View
            style={[
              p.valuePill,
              { borderColor: atGoal ? `${GREEN}40` : "rgba(255,255,255,0.1)" },
            ]}
          >
            <Text style={[p.valueNum, { color: atGoal ? GREEN : COLORS.text }]}>
              {movement}
            </Text>
            <Text style={p.valueUnit}> min</Text>
          </View>
        </View>
        <Slider
          style={p.slider}
          minimumValue={0}
          maximumValue={120}
          step={5}
          value={movement}
          onValueChange={setMovement}
          onSlidingComplete={(v) => save({ movement: v })}
          minimumTrackTintColor={atGoal ? GREEN : "rgba(255,255,255,0.3)"}
          maximumTrackTintColor="rgba(255,255,255,0.07)"
          thumbTintColor={atGoal ? GREEN : COLORS.text}
        />
        <View style={p.metricFooter}>
          <Text style={p.tip}>Aim for 60 minutes</Text>
          {atGoal && (
            <Text style={[p.goalBadge, { color: GREEN }]}>Goal hit ✓</Text>
          )}
        </View>
        <View style={p.track}>
          <View
            style={[
              p.fill,
              {
                width: `${pct}%`,
                backgroundColor: atGoal ? GREEN : "rgba(255,255,255,0.2)",
              },
            ]}
          />
        </View>
      </View>

      {/* Workout type picker */}
      <View style={p.tipsCard}>
        <Text style={p.tipsTitle}>WORKOUT TYPE</Text>
        <View style={p.workoutGrid}>
          {workouts.map((w) => (
            <TouchableOpacity
              key={w}
              style={[
                p.workoutChip,
                selected === w && {
                  backgroundColor: GREEN,
                  borderColor: GREEN,
                },
              ]}
              onPress={() => setSelected(w)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  p.workoutTxt,
                  selected === w && { color: "#000", fontWeight: "700" },
                ]}
              >
                {w}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── 7-day history ─────────────────────────────────────────────
function HistoryStrip({ entries }) {
  const today = new Date();
  const LABELS = ["M", "T", "W", "T", "F", "S", "S"];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const e = entries.find((x) => x.date === key);
    return {
      label: LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
      isToday: i === 6,
      sleep: e ? Math.min((e.sleep || 0) / 8, 1) : 0,
      water: e ? Math.min((e.water || 0) / 8, 1) : 0,
      movement: e ? Math.min((e.movement || 0) / 60, 1) : 0,
    };
  });

  return (
    <View style={p.historyCard}>
      <Text style={p.secLabel}>7-DAY HISTORY</Text>
      <View style={p.historyRow}>
        {days.map((d, i) => (
          <View key={i} style={p.historyDay}>
            <Text style={[p.historyLbl, d.isToday && { color: GREEN }]}>
              {d.label}
            </Text>
            <View style={p.barStack}>
              {[
                { val: d.sleep, color: COLORS.neonBlue },
                { val: d.water, color: GREEN },
                { val: d.movement, color: COLORS.neonAmber },
              ].map((bar, j) => (
                <View key={j} style={p.barTrack}>
                  <View
                    style={[
                      p.barFill,
                      {
                        height: `${bar.val * 100}%`,
                        backgroundColor: bar.color,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      <View style={p.legendRow}>
        {[
          ["Sleep", COLORS.neonBlue],
          ["Water", GREEN],
          ["Move", COLORS.neonAmber],
        ].map(([l, c]) => (
          <View key={l} style={p.legendItem}>
            <View style={[p.legendDot, { backgroundColor: c }]} />
            <Text style={p.legendTxt}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PHYSICAL SCREEN
// ─────────────────────────────────────────────────────────────
export default function PhysicalScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("sleep");
  const [sleep, setSleep] = useState(0);
  const [water, setWater] = useState(0);
  const [movement, setMovement] = useState(0);
  const [loggedAt, setLoggedAt] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [today, all] = await Promise.all([
      healthStore.getToday(),
      healthStore.list(),
    ]);
    if (today) {
      setSleep(today.sleep || 0);
      setWater(today.water || 0);
      setMovement(today.movement || 0);
      setLoggedAt(today.logged_at);
    }
    setAllEntries(Array.isArray(all) ? all : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const save = async (patch) => {
    const current = { sleep, water, movement, ...patch };
    const entry = await healthStore.saveToday(current);
    setLoggedAt(entry.logged_at);
    if (patch.sleep !== undefined) setSleep(patch.sleep);
    if (patch.water !== undefined) setWater(patch.water);
    if (patch.movement !== undefined) setMovement(patch.movement);
    const all = await healthStore.list();
    setAllEntries(Array.isArray(all) ? all : []);
  };

  const sleepScore = Math.min(sleep / 8, 1);
  const waterScore = Math.min(water / 8, 1);
  const movementScore = Math.min(movement / 60, 1);
  const overallScore = Math.round(
    ((sleepScore + waterScore + movementScore) / 3) * 100,
  );
  const scoreColor = overallScore >= 50 ? GREEN : RED;

  const formatTime = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={p.root} edges={["top"]}>
      {/* Header */}
      <View style={p.header}>
        <View>
          <Text style={p.title}>Physical Health</Text>
          <Text style={p.sub}>
            {loggedAt
              ? `Last logged ${formatTime(loggedAt)}`
              : "Log today's metrics"}
          </Text>
        </View>
        <View style={[p.scorePill, { borderColor: `${scoreColor}30` }]}>
          <Text style={[p.scoreNum, { color: scoreColor }]}>
            {overallScore}
          </Text>
          <Text style={[p.scorePct, { color: scoreColor }]}>%</Text>
        </View>
      </View>

      {/* Overall bar */}
      <View style={p.overallCard}>
        <View style={p.overallRow}>
          <Text style={p.overallLabel}>Today's score</Text>
          <Text style={[p.overallPct, { color: scoreColor }]}>
            {overallScore}%
          </Text>
        </View>
        <View style={p.overallTrack}>
          <View
            style={[
              p.overallFill,
              { width: `${overallScore}%`, backgroundColor: scoreColor },
            ]}
          />
        </View>
      </View>

      {/* Sub tabs */}
      <View style={p.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[p.tabBtn, activeTab === tab.key && p.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[p.tabLabel, activeTab === tab.key && p.tabLabelActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GREEN}
          />
        }
      >
        {activeTab === "sleep" && (
          <SleepTab sleep={sleep} setSleep={setSleep} save={save} />
        )}
        {activeTab === "diet" && (
          <DietTab water={water} setWater={setWater} save={save} />
        )}
        {activeTab === "gym" && (
          <GymTab movement={movement} setMovement={setMovement} save={save} />
        )}

        <HistoryStrip entries={allEntries} />
      </ScrollView>

      {/* Fan FAB */}
      <FanFAB
        onLogSleep={() => setActiveTab("sleep")}
        onLogDiet={() => setActiveTab("diet")}
        onLogGym={() => setActiveTab("gym")}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: "Orbitron",
    color: GREEN,
    letterSpacing: 1,
  },
  sub: { fontSize: 10, color: MUTED, marginTop: 3 },
  scorePill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  scoreNum: { fontSize: 24, fontWeight: "900" },
  scorePct: { fontSize: 12, fontWeight: "700" },

  overallCard: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  overallLabel: { fontSize: 11, color: MUTED },
  overallPct: { fontSize: 13, fontWeight: "800" },
  overallTrack: {
    height: 5,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 4,
    overflow: "hidden",
  },
  overallFill: { height: "100%", borderRadius: 4 },

  // Sub tabs
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 11,
  },
  tabBtnActive: { backgroundColor: GREEN },
  tabLabel: { fontSize: 12, fontWeight: "700", color: MUTED },
  tabLabelActive: { color: "#000" },

  // Tab content
  tabContent: { paddingHorizontal: 14 },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 10,
    overflow: "hidden",
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  metricTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  valuePill: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  valueNum: { fontSize: 18, fontWeight: "900" },
  valueUnit: { fontSize: 10, color: MUTED, fontWeight: "600" },
  slider: { width: "100%", height: 40 },
  metricFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tip: { fontSize: 10, color: MUTED },
  goalBadge: { fontSize: 10, fontWeight: "700" },
  track: {
    height: 3,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 2 },

  // Tips card
  tipsCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  tipDot: { width: 6, height: 6, borderRadius: 3 },
  tipTxt: { fontSize: 12, color: COLORS.textDim },

  // Meal checklist
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  mealCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  mealTick: { color: "#000", fontSize: 11, fontWeight: "900" },
  mealLabel: { fontSize: 13, color: COLORS.text, fontWeight: "600" },

  // Workout chips
  workoutGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  workoutChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  workoutTxt: { fontSize: 12, color: MUTED },

  // History
  historyCard: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  secLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  historyDay: { alignItems: "center", flex: 1 },
  historyLbl: { fontSize: 9, color: MUTED, marginBottom: 6 },
  barStack: {
    flexDirection: "row",
    gap: 2,
    height: 60,
    alignItems: "flex-end",
  },
  barTrack: {
    width: 6,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: { width: "100%", borderRadius: 3 },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendTxt: { fontSize: 9, color: MUTED },

  // FAB
  fabWrap: {
    position: "absolute",
    bottom: 28,
    right: 24,
    alignItems: "flex-end",
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  fabIcon: { fontSize: 26, color: "#000", fontWeight: "900", lineHeight: 30 },
  fanStack: { position: "absolute", right: 0, alignItems: "flex-end" },
  fanItem: { alignItems: "center", flexDirection: "row", gap: 10 },
  fanBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  fanIcon: { fontSize: 20 },
  fanLabel: {
    fontSize: 11,
    color: COLORS.textDim,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});
