// screens/Physical.js  —  1Life Hub
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
import { COLORS } from "../constants/colors";

const GREEN = COLORS.neonGreen;
const RED = COLORS.neonRed;
const MUTED = COLORS.textMuted;
const AMBER = COLORS.neonAmber || "#fbbf24";

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
    tip: "Aim for 60 minutes",
  },
};

// ── LOG MODAL ─────────────────────────────────────────────────
function LogModal({
  visible,
  metric,
  currentValue,
  onSave,
  onClose,
  meals,
  loggedMeals,
  onMealToggle,
  workoutType,
  onWorkoutType,
}) {
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, visible]);

  if (!metric) return null;
  const cfg = METRIC_CONFIG[metric];
  const pct = Math.min((value / cfg.goal) * 100, 100);
  const atGoal = value >= cfg.goal;
  const remaining = cfg.goal - value;

  const contextTip = atGoal
    ? "🎯 Goal hit! Great work!"
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
            <Ionicons name={cfg.icon} size={22} color={GREEN} />
            <Text style={lg.title}>LOG {cfg.label.toUpperCase()}</Text>
          </View>

          {/* Big value */}
          <View style={lg.valueRow}>
            <Text style={[lg.bigNum, { color: atGoal ? GREEN : COLORS.text }]}>
              {value % 1 === 0 ? value : value.toFixed(1)}
            </Text>
            <Text style={lg.bigUnit}>{cfg.unit}</Text>
            <Text style={lg.divSlash}>/</Text>
            <Text style={lg.goalNum}>{cfg.goal}</Text>
          </View>

          {/* Slider */}
          <Slider
            style={{ width: "100%", height: 44 }}
            minimumValue={0}
            maximumValue={cfg.max}
            step={cfg.step}
            value={value}
            onValueChange={setValue}
            minimumTrackTintColor={atGoal ? GREEN : "rgba(255,255,255,0.35)"}
            maximumTrackTintColor="rgba(255,255,255,0.08)"
            thumbTintColor={GREEN}
          />

          {/* Progress bar */}
          <View style={lg.progressTrack}>
            <View
              style={[
                lg.progressFill,
                { width: `${pct}%`, backgroundColor: atGoal ? GREEN : AMBER },
              ]}
            />
          </View>

          {/* Contextual tip */}
          <Text style={[lg.contextTip, { color: atGoal ? GREEN : MUTED }]}>
            {contextTip}
          </Text>

          {/* Quick picks */}
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

          {/* Meals section for diet */}
          {metric === "diet" && (
            <View style={lg.extrasSection}>
              <Text style={lg.extrasTitle}>MEALS TODAY</Text>
              <View style={lg.mealsRow}>
                {meals.map((meal) => (
                  <TouchableOpacity
                    key={meal}
                    style={[
                      lg.mealChip,
                      loggedMeals[meal] && lg.mealChipActive,
                    ]}
                    onPress={() => onMealToggle(meal)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        lg.mealChipTxt,
                        loggedMeals[meal] && lg.mealChipTxtActive,
                      ]}
                    >
                      {meal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Workout type for gym */}
          {metric === "gym" && (
            <View style={lg.extrasSection}>
              <Text style={lg.extrasTitle}>WORKOUT TYPE</Text>
              <View style={lg.mealsRow}>
                {["Cardio", "Strength", "Flexibility", "Sports", "Walk"].map(
                  (w) => (
                    <TouchableOpacity
                      key={w}
                      style={[
                        lg.mealChip,
                        workoutType === w && lg.mealChipActive,
                      ]}
                      onPress={() => onWorkoutType(w)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          lg.mealChipTxt,
                          workoutType === w && lg.mealChipTxtActive,
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

          {/* Sleep quality for sleep */}
          {metric === "sleep" && (
            <View style={lg.extrasSection}>
              <Text style={lg.extrasTitle}>SLEEP QUALITY</Text>
              <View style={lg.mealsRow}>
                {["Poor", "Fair", "Good", "Great"].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      lg.mealChip,
                      workoutType === q && lg.mealChipActive,
                    ]}
                    onPress={() => onWorkoutType(q)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        lg.mealChipTxt,
                        workoutType === q && lg.mealChipTxtActive,
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
            <TouchableOpacity
              style={lg.cancelBtn}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={lg.cancelTxt}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={lg.saveBtn}
              onPress={() => {
                onSave(metric, value);
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={18} color="#000" />
              <Text style={lg.saveTxt}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── STAT CARD — read-only with +/- quick buttons for diet ─────
function StatCard({ metricKey, value, onQuickChange }) {
  const cfg = METRIC_CONFIG[metricKey];
  const pct = Math.min((value / cfg.goal) * 100, 100);
  const atGoal = value >= cfg.goal;
  const color = atGoal ? GREEN : pct > 0 ? "rgba(255,255,255,0.7)" : MUTED;

  const remaining = Math.max(0, cfg.goal - value);
  const contextTip = atGoal
    ? "🎯 Goal hit! Great work!"
    : metricKey === "sleep"
      ? `${remaining.toFixed(1)} more hours to goal`
      : metricKey === "diet"
        ? `${remaining} more glasses to goal`
        : `${remaining} more minutes to goal`;

  return (
    <View style={sc.card}>
      <View style={sc.row}>
        <View
          style={[
            sc.iconWrap,
            {
              backgroundColor: atGoal ? `${GREEN}20` : "rgba(255,255,255,0.06)",
            },
          ]}
        >
          <Ionicons name={cfg.icon} size={22} color={atGoal ? GREEN : MUTED} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={sc.label}>{cfg.label}</Text>
          <View style={sc.valueRow}>
            <Text style={[sc.value, { color }]}>
              {value % 1 === 0 ? value : value.toFixed(1)}
            </Text>
            <Text style={sc.unit}> {cfg.unit}</Text>
            <Text style={sc.goal}> / {cfg.goal}</Text>
          </View>
        </View>

        {/* +/- buttons for diet, badge for others */}
        {metricKey === "diet" ? (
          <View style={sc.quickBtns}>
            <TouchableOpacity
              style={sc.minusBtn}
              onPress={() => onQuickChange(-1)}
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={16} color={MUTED} />
            </TouchableOpacity>
            <TouchableOpacity
              style={sc.plusBtn}
              onPress={() => onQuickChange(1)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        ) : atGoal ? (
          <View style={sc.goalBadge}>
            <Text style={sc.goalTxt}>GOAL HIT</Text>
          </View>
        ) : value > 0 ? (
          <View style={sc.progressBadge}>
            <Text style={sc.progressBadgeTxt}>{Math.round(pct)}%</Text>
          </View>
        ) : (
          <View style={sc.emptyBadge}>
            <Text style={sc.emptyBadgeTxt}>Not logged</Text>
          </View>
        )}
      </View>

      <View style={sc.track}>
        <View
          style={[
            sc.fill,
            {
              width: `${pct}%`,
              backgroundColor: atGoal ? GREEN : pct > 0 ? AMBER : "transparent",
            },
          ]}
        />
      </View>
      <Text style={[sc.contextTip, { color: atGoal ? GREEN : MUTED }]}>
        {contextTip}
      </Text>
    </View>
  );
}

// ── TAB CONTENT ───────────────────────────────────────────────
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
            <Ionicons name="checkmark-circle-outline" size={14} color={GREEN} />
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
      <StatCard metricKey="diet" value={water} onQuickChange={onQuickWater} />
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

// ── 7-DAY HISTORY ─────────────────────────────────────────────
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
                { val: d.move, color: AMBER },
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
          ["SLEEP", COLORS.neonBlue],
          ["WATER", GREEN],
          ["MOVE", AMBER],
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

// ── MAIN SCREEN ───────────────────────────────────────────────
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

  // Meal & workout state (for modal)
  const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
  const [loggedMeals, setLoggedMeals] = useState({});
  const [workoutType, setWorkoutType] = useState(null);
  const [sleepQuality, setSleepQuality] = useState(null);

  // Navigate to correct tab when route param changes
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
    // Update local state with new value first
    if (patch.sleep !== undefined) setSleep(patch.sleep);
    if (patch.water !== undefined) setWater(patch.water);
    if (patch.movement !== undefined) setMovement(patch.movement);
    try {
      const current = { sleep, water, movement, ...patch };
      const entry = await healthStore.saveToday(current);
      setLoggedAt(entry?.logged_at || new Date().toISOString());
      const all = await healthStore.list();
      setAllEntries(Array.isArray(all) ? all : []);
      // Reset display to 0 after save — values are persisted in healthStore
      // so XP on Today screen still reflects the saved data
      setTimeout(() => {
        if (patch.sleep !== undefined) setSleep(0);
        if (patch.water !== undefined) setWater(0);
        if (patch.movement !== undefined) setMovement(0);
      }, 800); // brief delay so user sees the value before reset
    } catch {
      Alert.alert("Error", "Could not save. Please try again.");
    }
  };

  const openLog = (metric) => {
    setLogMetric(metric);
    setLogModal(true);
  };

  const handleModalSave = (metric, value) => {
    const keyMap = { sleep: "sleep", diet: "water", gym: "movement" };
    save({ [keyMap[metric]]: value });
    setActiveTab(metric);
    // Reset modal extras after save
    setLoggedMeals({});
    setWorkoutType(null);
    setSleepQuality(null);
  };

  // Quick +/- for diet water count
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
    overallScore >= 70 ? GREEN : overallScore >= 40 ? AMBER : RED;
  const formatTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const modalCurrentValue =
    logMetric === "sleep" ? sleep : logMetric === "diet" ? water : movement;

  return (
    <SafeAreaView style={p.root} edges={["top"]}>
      {/* Header */}
      <View style={p.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={p.backBtn}>
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={p.title}>PHYSICAL HEALTH</Text>
          <Text style={p.sub}>
            {loggedAt
              ? `Last logged ${formatTime(loggedAt)}`
              : "Tap + to log today's metrics"}
          </Text>
        </View>
        <View
          style={[
            p.scorePill,
            {
              borderColor: `${scoreColor}40`,
              backgroundColor: `${scoreColor}12`,
            },
          ]}
        >
          <Text style={[p.scoreNum, { color: scoreColor }]}>
            {overallScore}
          </Text>
          <Text style={[p.scorePct, { color: scoreColor }]}>%</Text>
        </View>
      </View>

      {/* Overall bar */}
      <View style={p.overallCard}>
        <View style={p.overallRow}>
          <Text style={p.overallLabel}>TODAY'S SCORE</Text>
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

      {/* Tab bar */}
      <View style={p.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[p.tabBtn, activeTab === tab.key && p.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? "#000" : MUTED}
            />
            <Text
              style={[p.tabLabel, activeTab === tab.key && p.tabLabelActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
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
        {activeTab === "sleep" && <SleepTab sleep={sleep} />}
        {activeTab === "diet" && (
          <DietTab water={water} onQuickWater={handleQuickWater} />
        )}
        {activeTab === "gym" && <GymTab movement={movement} />}
        <HistoryStrip entries={allEntries} />
      </ScrollView>

      {/* Centred + FAB — opens log modal for current tab directly */}
      <TouchableOpacity
        style={p.fab}
        onPress={() => openLog(activeTab)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>

      {/* Log Modal */}
      <LogModal
        visible={logModal}
        metric={logMetric}
        currentValue={modalCurrentValue}
        onSave={handleModalSave}
        onClose={() => {
          setLogModal(false);
          setLogMetric(null);
        }}
        meals={MEALS}
        loggedMeals={loggedMeals}
        onMealToggle={(meal) =>
          setLoggedMeals((prev) => ({ ...prev, [meal]: !prev[meal] }))
        }
        workoutType={logMetric === "sleep" ? sleepQuality : workoutType}
        onWorkoutType={(v) => {
          if (logMetric === "sleep") setSleepQuality(v);
          else setWorkoutType(v);
        }}
      />
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const p = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 16,
    fontFamily: "Orbitron",
    color: GREEN,
    letterSpacing: 1,
  },
  sub: { fontSize: 10, color: MUTED, marginTop: 2 },
  scorePill: {
    flexDirection: "row",
    alignItems: "baseline",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  scoreNum: { fontSize: 24, fontWeight: "900" },
  scorePct: { fontSize: 12, fontWeight: "700" },
  overallCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  overallLabel: {
    fontSize: 10,
    color: MUTED,
    letterSpacing: 1,
    fontWeight: "700",
  },
  overallPct: { fontSize: 13, fontWeight: "900" },
  overallTrack: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 4,
    overflow: "hidden",
  },
  overallFill: { height: "100%", borderRadius: 4 },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  tabBtnActive: { backgroundColor: GREEN },
  tabLabel: { fontSize: 12, fontWeight: "700", color: MUTED },
  tabLabelActive: { color: "#000" },
  tabContent: { paddingHorizontal: 16 },
  tipsCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 14,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  tipTxt: { fontSize: 13, color: COLORS.textDim },
  historyCard: {
    marginHorizontal: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
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
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendTxt: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "700",
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
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GREEN,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});

const sc = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valueRow: { flexDirection: "row", alignItems: "baseline" },
  value: { fontSize: 30, fontWeight: "900" },
  unit: { fontSize: 14, color: MUTED, fontWeight: "600" },
  goal: { fontSize: 12, color: "rgba(255,255,255,0.25)" },
  track: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  fill: { height: "100%", borderRadius: 4 },
  contextTip: { fontSize: 11, color: MUTED },
  goalBadge: {
    backgroundColor: `${GREEN}18`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${GREEN}35`,
  },
  goalTxt: {
    fontSize: 10,
    fontWeight: "800",
    color: GREEN,
    letterSpacing: 0.5,
  },
  progressBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  progressBadgeTxt: { fontSize: 11, fontWeight: "700", color: COLORS.text },
  emptyBadge: {
    backgroundColor: "rgba(255,80,80,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.25)",
  },
  emptyBadgeTxt: { fontSize: 10, fontWeight: "700", color: RED },
  quickBtns: { flexDirection: "row", gap: 8 },
  minusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
});

const lg = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    backgroundColor: "#0d0d1a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
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
  title: { fontSize: 13, fontWeight: "900", color: GREEN, letterSpacing: 2 },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
    marginBottom: 4,
  },
  bigNum: { fontSize: 60, fontWeight: "900", lineHeight: 68 },
  bigUnit: { fontSize: 18, color: MUTED, fontWeight: "600" },
  divSlash: {
    fontSize: 22,
    color: "rgba(255,255,255,0.2)",
    marginHorizontal: 4,
  },
  goalNum: { fontSize: 22, color: "rgba(255,255,255,0.3)", fontWeight: "700" },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  contextTip: { fontSize: 12, color: MUTED, marginBottom: 16 },
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
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  quickBtnActive: { backgroundColor: GREEN, borderColor: GREEN },
  quickTxt: { fontSize: 13, color: MUTED, fontWeight: "700" },
  quickTxtActive: { color: "#000" },
  extrasSection: { marginBottom: 16 },
  extrasTitle: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 10,
  },
  mealsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mealChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  mealChipActive: { backgroundColor: GREEN, borderColor: GREEN },
  mealChipTxt: { fontSize: 12, color: MUTED, fontWeight: "600" },
  mealChipTxtActive: { color: "#000", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
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
    backgroundColor: GREEN,
    flexDirection: "row",
    gap: 8,
  },
  saveTxt: { fontSize: 13, fontWeight: "900", color: "#000", letterSpacing: 1 },
});
