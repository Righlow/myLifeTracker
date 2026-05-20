/**
 * screens/Physical.js — 1Life Hub | Physical Health Screen
 *
 * PURPOSE:
 * Allows users to log and track three core physical health metrics daily:
 * sleep (hours), water intake (glasses), and movement (active minutes).
 * Each metric has a defined daily goal and contributes equally to the
 * Physical score shown on the Today dashboard.
 *
 * KEY FEATURES:
 *  - Three tabs: Sleep / Diet / Gym — each with dedicated stat card
 *  - Stat cards show current value, goal, progress bar, and contextual tip
 *  - Log Modal: slider + quick-select buttons for fast data entry
 *  - Sleep quality tags (Poor/Fair/Good/Great) and meal logging for Diet tab
 *  - Workout type selector for Gym tab
 *  - 7-Day History strip: bar chart showing the past week at a glance
 *  - Score pill in header updates in real-time as data is logged
 *
 * DATA FLOW:
 *  Reads/writes via healthStore (store.js) → AsyncStorage key "1life_health"
 *  One entry per calendar day; saves the entire day's data in one object.
 *
 * DESIGN DECISION:
 * RED was chosen as the identity colour for Physical because it conveys
 * energy, urgency, and the body. The tab-based layout keeps each metric
 * focused without overwhelming the user with all three at once.
 *
 * SCORING:
 *  sleepScore  = min(sleep / 8,  1)   → 8 hours = 100%
 *  waterScore  = min(water / 8,  1)   → 8 glasses = 100%
 *  moveScore   = min(movement / 60, 1) → 60 minutes = 100%
 *  overall     = average of the three × 100
 */
// screens/Physical.js — 1Life Hub | RED identity screen
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { healthStore } from "../store";

const BG = "#0A0E27"; // dark navy — page background
const RED = "#CC0000"; // Physical screen - alerts
const BLUE = "#0047AB"; // Routine - pulse card
const GREEN = "#00C060"; // Today - header / XP / goals
const ORANGE = "#FF4B0A"; // deadlines - warnings
const WHITE = "#FFFFFF"; // ALL text and icons on dark surfaces
const MUTED = "rgba(255,255,255,0.55)";
const DIM = "rgba(255,255,255,0.80)";

const TABS = [
  { key: "sleep", label: "Sleep", icon: "moon-outline" },
  { key: "diet", label: "Diet", icon: "nutrition-outline" },
  { key: "gym", label: "Gym", icon: "barbell-outline" },
];

const METRIC_CONFIG = {
  sleep: {
    label: "Hours Slept",
    unit: "hrs",
    max: 12,
    step: 0.5,
    goal: 8,
    icon: "moon-outline",
    quick: [5, 6, 7, 8, 9],
    quickFmt: (v) => `${v}h`,
    tip: "Aim for 7–9 hours",
  },
  diet: {
    label: "Water Glasses",
    unit: "gl",
    max: 12,
    step: 1,
    goal: 8,
    icon: "nutrition-outline",
    quick: [2, 4, 6, 8, 10],
    quickFmt: (v) => `${v}gl`,
    tip: "Aim for 8 glasses",
  },
  gym: {
    label: "Active Minutes",
    unit: "min",
    max: 120,
    step: 5,
    goal: 60,
    icon: "barbell-outline",
    quick: [15, 30, 45, 60, 90],
    quickFmt: (v) => `${v}m`,
    tip: "Aim for 60 min",
  },
};

// LogModal — bottom sheet with slider and quick buttons to log a metric value
//  LOG MODAL
function LogModal({
  visible,
  metric,
  currentValue,
  onSave,
  onClose,
  meals,
  loggedMeals,
  onMealToggle,
  extra,
  onExtra,
}) {
  const [value, setValue] = useState(currentValue);
  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, visible]);
  if (!metric) return null;

  const cfg = METRIC_CONFIG[metric];
  const pct = Math.min((value / cfg.goal) * 100, 100);
  const atGoal = value >= cfg.goal;
  const remaining = Math.max(0, cfg.goal - value);
  const tip = atGoal
    ? "Goal hit!"
    : metric === "sleep"
      ? `${remaining.toFixed(1)} more hours to goal`
      : metric === "diet"
        ? `${remaining} more glasses to goal`
        : `${remaining} more minutes to goal`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={lg.overlay}
      >
        <TouchableOpacity
          style={lg.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={lg.sheet}>
          <View style={lg.handle} />
          <View style={lg.header}>
            <Ionicons name={cfg.icon} size={20} color={RED} />
            <Text style={lg.title}>LOG {cfg.label.toUpperCase()}</Text>
          </View>

          <View style={lg.valueRow}>
            <Text style={[lg.bigNum, { color: atGoal ? GREEN : WHITE }]}>
              {value % 1 === 0 ? value : value.toFixed(1)}
            </Text>
            <Text style={lg.bigUnit}>{cfg.unit}</Text>
            <Text style={lg.slash}>/</Text>
            <Text style={lg.goalNum}>{cfg.goal}</Text>
          </View>

          <Slider
            style={{ width: "100%", height: 44 }}
            minimumValue={0}
            maximumValue={cfg.max}
            step={cfg.step}
            value={value}
            onValueChange={setValue}
            minimumTrackTintColor={atGoal ? GREEN : RED}
            maximumTrackTintColor="rgba(0,0,0,0.12)"
            thumbTintColor={atGoal ? GREEN : RED}
          />

          <View style={lg.progressTrack}>
            <View
              style={[
                lg.progressFill,
                { width: `${pct}%`, backgroundColor: atGoal ? GREEN : RED },
              ]}
            />
          </View>
          <Text style={[lg.tip, { color: atGoal ? GREEN : MUTED }]}>{tip}</Text>

          <View style={lg.quickRow}>
            {cfg.quick.map((v) => (
              <TouchableOpacity
                key={v}
                style={[lg.quickBtn, value === v && lg.quickBtnActive]}
                onPress={() => setValue(v)}
              >
                <Text style={[lg.quickTxt, value === v && lg.quickTxtActive]}>
                  {cfg.quickFmt(v)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {metric === "diet" && (
            <View style={lg.extras}>
              <Text style={lg.extrasTitle}>MEALS TODAY</Text>
              <View style={lg.chipsRow}>
                {meals.map((meal) => (
                  <TouchableOpacity
                    key={meal}
                    style={[
                      lg.chip,
                      loggedMeals[meal] && {
                        backgroundColor: GREEN,
                        borderColor: GREEN,
                      },
                    ]}
                    onPress={() => onMealToggle(meal)}
                  >
                    <Text
                      style={[
                        lg.chipTxt,
                        loggedMeals[meal] && { color: BG, fontWeight: "700" },
                      ]}
                    >
                      {meal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {metric === "gym" && (
            <View style={lg.extras}>
              <Text style={lg.extrasTitle}>WORKOUT TYPE</Text>
              <View style={lg.chipsRow}>
                {["Cardio", "Strength", "Flexibility", "Sports", "Walk"].map(
                  (w) => (
                    <TouchableOpacity
                      key={w}
                      style={[
                        lg.chip,
                        extra === w && {
                          backgroundColor: RED,
                          borderColor: RED,
                        },
                      ]}
                      onPress={() => onExtra(w)}
                    >
                      <Text
                        style={[
                          lg.chipTxt,
                          extra === w && { color: WHITE, fontWeight: "700" },
                        ]}
                      >
                        {w}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>
          )}

          {metric === "sleep" && (
            <View style={lg.extras}>
              <Text style={lg.extrasTitle}>SLEEP QUALITY</Text>
              <View style={lg.chipsRow}>
                {["Poor", "Fair", "Good", "Great"].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      lg.chip,
                      extra === q && {
                        backgroundColor: BLUE,
                        borderColor: BLUE,
                      },
                    ]}
                    onPress={() => onExtra(q)}
                  >
                    <Text
                      style={[
                        lg.chipTxt,
                        extra === q && { color: WHITE, fontWeight: "700" },
                      ]}
                    >
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={lg.actions}>
            <TouchableOpacity style={lg.cancelBtn} onPress={onClose}>
              <Text style={lg.cancelTxt}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={lg.saveBtn}
              onPress={() => {
                onSave(metric, value);
                onClose();
              }}
            >
              <Ionicons name="checkmark" size={16} color={WHITE} />
              <Text style={lg.saveTxt}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// StatCard — displays current value vs goal with progress bar and contextual tip text
// ── STAT CARD
function StatCard({ metricKey, value }) {
  const cfg = METRIC_CONFIG[metricKey];
  const pct = Math.min((value / cfg.goal) * 100, 100);
  const atGoal = value >= cfg.goal;
  const remaining = Math.max(0, cfg.goal - value);
  const tipText = atGoal
    ? "Goal hit!"
    : metricKey === "sleep"
      ? `${remaining.toFixed(1)} more hours to goal`
      : metricKey === "diet"
        ? `${remaining} more glasses to goal`
        : `${remaining} more minutes to goal`;
  const barColor = atGoal ? GREEN : pct > 0 ? ORANGE : "rgba(0,0,0,0.12)";

  return (
    <View style={p.statCard}>
      <View style={p.statRow}>
        <View
          style={[
            p.statIcon,
            {
              backgroundColor: atGoal ? `${GREEN}18` : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <Ionicons name={cfg.icon} size={20} color={atGoal ? GREEN : DIM} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={p.statLabel}>{cfg.label.toUpperCase()}</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: 3,
              marginTop: 2,
            }}
          >
            <Text style={[p.statValue, { color: atGoal ? GREEN : WHITE }]}>
              {value % 1 === 0 ? value : value.toFixed(1)}
            </Text>
            <Text style={p.statUnit}>{cfg.unit}</Text>
            <Text style={p.statGoal}>/ {cfg.goal}</Text>
          </View>
        </View>
        {atGoal ? (
          <View style={p.goalBadge}>
            <Text style={p.goalBadgeTxt}>GOAL HIT</Text>
          </View>
        ) : value > 0 ? (
          <View style={p.pctBadge}>
            <Text style={p.pctBadgeTxt}>{Math.round(pct)}%</Text>
          </View>
        ) : (
          <View style={p.emptyBadge}>
            <Text style={p.emptyBadgeTxt}>Not logged</Text>
          </View>
        )}
      </View>
      <View style={p.statTrack}>
        <View
          style={[p.statFill, { width: `${pct}%`, backgroundColor: barColor }]}
        />
      </View>
      <Text style={[p.statTip, { color: atGoal ? GREEN : MUTED }]}>
        {tipText}
      </Text>
    </View>
  );
}

// Tab content components — one per metric, rendered based on activeTab state
//TAB CONTENT
function SleepTab({ sleep }) {
  return (
    <View style={p.tabContent}>
      <StatCard metricKey="sleep" value={sleep} />
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

function DietTab({ water, onQuickWater }) {
  return (
    <View style={p.tabContent}>
      <StatCard metricKey="diet" value={water} />
      <View style={p.quickWaterRow}>
        <TouchableOpacity
          style={p.waterBtn}
          onPress={() => onQuickWater(-1)}
          activeOpacity={0.8}
        >
          <Ionicons name="remove" size={20} color={DIM} />
        </TouchableOpacity>
        <Text style={p.waterLabel}>Quick adjust</Text>
        <TouchableOpacity
          style={[p.waterBtn, { backgroundColor: GREEN, borderColor: GREEN }]}
          onPress={() => onQuickWater(1)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={BG} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GymTab({ movement }) {
  return (
    <View style={p.tabContent}>
      <StatCard metricKey="gym" value={movement} />
    </View>
  );
}

// HistoryStrip — bar chart of the past 7 days showing sleep/water/movement
//  7-DAY HISTORY
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
      move: e ? Math.min((e.movement || 0) / 60, 1) : 0,
    };
  });
  return (
    <View style={p.historyCard}>
      <Text style={p.historyTitle}>7-DAY HISTORY</Text>
      <View style={p.historyRow}>
        {days.map((d, i) => (
          <View key={i} style={p.historyDay}>
            <Text style={[p.historyLbl, d.isToday && { color: RED }]}>
              {d.label}
            </Text>
            <View style={p.barStack}>
              {[
                { val: d.sleep, color: BLUE },
                { val: d.water, color: GREEN },
                { val: d.move, color: ORANGE },
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
          ["SLEEP", BLUE],
          ["WATER", GREEN],
          ["MOVE", ORANGE],
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

// PhysicalScreen — main exported component
// MAIN SCREEN component
export default function PhysicalScreen({ navigation, route }) {
  const defaultTab = route?.params?.defaultTab || "sleep";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [sleep, setSleep] = useState(0);
  const [water, setWater] = useState(0);
  const [movement, setMovement] = useState(0);
  const [loggedAt, setLoggedAt] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [logModal, setLogModal] = useState(false);
  const [logMetric, setLogMetric] = useState(null);
  const [loggedMeals, setLoggedMeals] = useState({});
  const [extra, setExtra] = useState(null);

  useEffect(() => {
    if (route?.params?.defaultTab) setActiveTab(route.params.defaultTab);
  }, [route?.params?.defaultTab]);

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
    const u = navigation.addListener("focus", load);
    return u;
  }, [navigation, load]);
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const save = async (patch) => {
    if (patch.sleep !== undefined) setSleep(patch.sleep);
    if (patch.water !== undefined) setWater(patch.water);
    if (patch.movement !== undefined) setMovement(patch.movement);
    try {
      const current = { sleep, water, movement, ...patch };
      const entry = await healthStore.saveToday(current);
      setLoggedAt(entry?.logged_at || new Date().toISOString());
      const all = await healthStore.list();
      setAllEntries(Array.isArray(all) ? all : []);
      setTimeout(() => {
        if (patch.sleep !== undefined) setSleep(0);
        if (patch.water !== undefined) setWater(0);
        if (patch.movement !== undefined) setMovement(0);
      }, 800);
    } catch {
      Alert.alert("Error", "Could not save. Please try again.");
    }
  };

  const handleModalSave = (metric, value) => {
    const keyMap = { sleep: "sleep", diet: "water", gym: "movement" };
    save({ [keyMap[metric]]: value });
    setActiveTab(metric);
    setLoggedMeals({});
    setExtra(null);
  };

  const handleQuickWater = (delta) => {
    const next = Math.max(0, Math.min(12, water + delta));
    save({ water: next });
  };

  const sleepScore = Math.min(sleep / 8, 1);
  const waterScore = Math.min(water / 8, 1);
  const movementScore = Math.min(movement / 60, 1);
  const overallScore = Math.round(
    ((sleepScore + waterScore + movementScore) / 3) * 100,
  );
  const scoreColor =
    overallScore >= 70 ? GREEN : overallScore >= 40 ? ORANGE : RED;
  const formatTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  const modalVal =
    logMetric === "sleep" ? sleep : logMetric === "diet" ? water : movement;

  return (
    <SafeAreaView style={p.root} edges={["top"]}>
      {/* ── RED HEADER BLOCK ── */}
      <View style={p.headerBlock}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={p.backBtn}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={p.title}>PHYSICAL</Text>
          <Text style={p.sub}>
            {loggedAt ? `Last logged ${formatTime(loggedAt)}` : "Tap + to log"}
          </Text>
        </View>
        <View style={p.scorePill}>
          <Text
            style={[
              p.scoreNum,
              { color: scoreColor === GREEN ? "#FFFFFF" : WHITE },
            ]}
          >
            {overallScore}
          </Text>
          <Text
            style={[
              p.scorePct,
              { color: scoreColor === GREEN ? "#FFFFFF" : MUTED },
            ]}
          >
            %
          </Text>
        </View>
      </View>

      {/* ── SCORE BAR ── */}
      <View style={p.scoreBar}>
        <View style={p.scoreBarTrack}>
          <View
            style={[
              p.scoreBarFill,
              { width: `${overallScore}%`, backgroundColor: scoreColor },
            ]}
          />
        </View>
        <Text style={[p.scoreBarPct, { color: scoreColor }]}>
          {overallScore}%
        </Text>
      </View>

      {/* ── TAB BAR ── */}
      <View style={p.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[p.tabBtn, activeTab === tab.key && p.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab.icon}
              size={15}
              color={activeTab === tab.key ? WHITE : MUTED}
            />
            <Text
              style={[p.tabLabel, activeTab === tab.key && p.tabLabelActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={RED}
          />
        }
      >
        {activeTab === "sleep" && <SleepTab sleep={sleep} />}
        {activeTab === "diet" && (
          <DietTab water={water} onQuickWater={handleQuickWater} />
        )}
        {activeTab === "gym" && <GymTab movement={movement} />}
        <HistoryStrip entries={allEntries} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={p.fab}
        onPress={() => {
          setLogMetric(activeTab);
          setLogModal(true);
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={WHITE} />
      </TouchableOpacity>

      <LogModal
        visible={logModal}
        metric={logMetric}
        currentValue={modalVal}
        onSave={handleModalSave}
        onClose={() => {
          setLogModal(false);
          setLogMetric(null);
        }}
        meals={["Breakfast", "Lunch", "Dinner", "Snacks"]}
        loggedMeals={loggedMeals}
        onMealToggle={(meal) =>
          setLoggedMeals((prev) => ({ ...prev, [meal]: !prev[meal] }))
        }
        extra={extra}
        onExtra={setExtra}
      />
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const p = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  headerBlock: {
    backgroundColor: RED,
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontFamily: "Orbitron",
    color: WHITE,
    letterSpacing: 1.5,
    lineHeight: 24,
  },
  sub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    marginTop: 2,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreNum: { fontSize: 22, fontWeight: "900" },
  scorePct: { fontSize: 11, fontWeight: "700" },
  scoreBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 14,
    marginTop: 10,
  },
  scoreBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  scoreBarFill: { height: "100%", borderRadius: 3 },
  scoreBarPct: {
    fontSize: 11,
    fontWeight: "800",
    width: 34,
    textAlign: "right",
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  tabBtnActive: { backgroundColor: RED },
  tabLabel: { fontSize: 11, fontWeight: "700", color: MUTED },
  tabLabelActive: { color: WHITE },
  tabContent: { paddingHorizontal: 14 },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
  },
  statRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  statValue: { fontSize: 28, fontWeight: "900" },
  statUnit: { fontSize: 12, color: MUTED, fontWeight: "600" },
  statGoal: {
    fontSize: 11,
    color: "rgba(255,255,255,0.60)",
    fontWeight: "600",
  },
  statTrack: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  statFill: { height: "100%", borderRadius: 3 },
  statTip: { fontSize: 11 },
  goalBadge: {
    backgroundColor: `${GREEN}18`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${GREEN}35`,
  },
  goalBadgeTxt: {
    fontSize: 9,
    fontWeight: "800",
    color: GREEN,
    letterSpacing: 0.5,
  },
  pctBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  pctBadgeTxt: { fontSize: 11, fontWeight: "700", color: WHITE },
  emptyBadge: {
    backgroundColor: `${RED}12`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${RED}30`,
  },
  emptyBadgeTxt: { fontSize: 9, fontWeight: "700", color: RED },
  tipsCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
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
    marginBottom: 8,
  },
  tipDot: { width: 6, height: 6, borderRadius: 3 },
  tipTxt: { fontSize: 13, color: DIM },
  quickWaterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
  },
  waterLabel: { fontSize: 13, color: DIM, fontWeight: "500" },
  waterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  historyCard: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  historyTitle: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  historyDay: { alignItems: "center", flex: 1 },
  historyLbl: { fontSize: 9, color: MUTED, marginBottom: 6, fontWeight: "600" },
  barStack: {
    flexDirection: "row",
    gap: 2,
    height: 56,
    alignItems: "flex-end",
  },
  barTrack: {
    width: 7,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 3,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: { width: "100%", borderRadius: 3 },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 18 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendTxt: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  fab: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    left: "50%",
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: RED,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});

const lg = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  sheet: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.10)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  title: { fontSize: 13, fontFamily: "Orbitron", color: RED, letterSpacing: 2 },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
    marginBottom: 4,
  },
  bigNum: { fontSize: 58, fontWeight: "900", lineHeight: 66 },
  bigUnit: { fontSize: 16, color: MUTED, fontWeight: "600" },
  slash: { fontSize: 20, color: "rgba(255,255,255,0.35)", marginHorizontal: 4 },
  goalNum: { fontSize: 20, color: "rgba(255,255,255,0.55)", fontWeight: "700" },
  progressTrack: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  tip: { fontSize: 11, marginBottom: 16 },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#FFFFFF",
  },
  quickBtnActive: { backgroundColor: RED, borderColor: RED },
  quickTxt: { fontSize: 13, color: MUTED, fontWeight: "700" },
  quickTxtActive: { color: WHITE },
  extras: { marginBottom: 16 },
  extrasTitle: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 10,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chipTxt: { fontSize: 12, color: MUTED },
  actions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cancelTxt: {
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
    letterSpacing: 1,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RED,
    flexDirection: "row",
    gap: 8,
  },
  saveTxt: { fontSize: 13, fontWeight: "900", color: WHITE, letterSpacing: 1 },
});
