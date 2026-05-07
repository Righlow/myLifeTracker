// ─────────────────────────────────────────────────────────────
// screens/GoalsScreen.js  —  1Life Hub
// Colour-coded progress bars (green ≥80 / blue ≥50 / amber ≥25 / red <25)
// SafeAreaView wraps root; ScrollView fills remaining space.
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { goalsStore } from "../store";

import { COLORS } from "../constants/colors"; // ✅ named import
const GREEN = COLORS.neonGreen; // ✅
const BLUE = COLORS.neonBlue; // ✅
const AMBER = COLORS.neonAmber; // ✅
const PURPLE = COLORS.neonPurple; // ✅
const RED = "#f87171"; // ✅ hardcode this one, it's not in COLORS

// Derive bar colour from progress %
function progressColor(pct) {
  if (pct >= 80) return GREEN;
  if (pct >= 50) return BLUE;
  if (pct >= 25) return AMBER;
  return RED;
}

const TIMEFRAMES = [
  { key: "yearly", label: "Yearly", color: PURPLE },
  { key: "monthly", label: "Monthly", color: BLUE },
  { key: "weekly", label: "Weekly", color: GREEN },
];

// ── Animated progress bar ─────────────────────────────────────
function ProgressBar({ pct, color, height = 8 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: Math.max(0, Math.min(pct, 100)),
      useNativeDriver: false,
      speed: 12,
      bounciness: 4,
    }).start();
  }, [pct]);

  return (
    <View style={[pbS.track, { height }]}>
      <Animated.View
        style={[
          pbS.fill,
          {
            height,
            width: anim.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: 0.5,
            shadowRadius: 8,
          },
        ]}
      />
      {/* Ghost fill line for reference */}
      <View style={[pbS.ghost, { height }]} />
    </View>
  );
}
const pbS = StyleSheet.create({
  track: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
    overflow: "hidden",
    width: "100%",
  },
  fill: { position: "absolute", left: 0, top: 0, borderRadius: 6 },
  ghost: { width: "100%", borderRadius: 6 },
});

// ── Goal card ─────────────────────────────────────────────────
function GoalCard({ goal, onUpdate, onRemove }) {
  const tf = TIMEFRAMES.find((t) => t.key === goal.timeframe) || TIMEFRAMES[1];
  const pct = goal.progress || 0;
  const barCol = progressColor(pct);
  const isYearly = goal.timeframe === "yearly";
  const isWeekly = goal.timeframe === "weekly";

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const nudge = (delta) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => onUpdate(goal, delta));
  };

  return (
    <Animated.View
      style={[
        s.goalCard,
        { borderTopColor: tf.color },
        isYearly && s.goalCardLarge,
        isWeekly && s.goalCardSmall,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Corner glow */}
      <View
        style={[s.cornerGlow, { backgroundColor: tf.color }]}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={s.goalHeader}>
        <View
          style={[
            s.timeframePill,
            { backgroundColor: `${tf.color}18`, borderColor: `${tf.color}35` },
          ]}
        >
          <Text style={[s.timeframeTxt, { color: tf.color }]}>
            {tf.label.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onRemove(goal)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.delTxt}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text
        style={[
          s.goalTitle,
          isYearly && s.goalTitleLarge,
          isWeekly && s.goalTitleSmall,
        ]}
      >
        {goal.title}
      </Text>
      {goal.description ? (
        <Text style={s.goalDesc}>{goal.description}</Text>
      ) : null}

      {/* Progress — pct label + colour-coded bar */}
      <View style={s.progressSection}>
        <View style={s.progressRow}>
          <Text
            style={[
              s.progressPct,
              { color: barCol },
              isYearly && s.progressPctLarge,
              isWeekly && s.progressPctSmall,
            ]}
          >
            {pct}%
          </Text>
          <Text style={[s.progressStatus, { color: barCol }]}>
            {pct >= 80
              ? "🔥 Almost there"
              : pct >= 50
                ? "💪 On track"
                : pct >= 25
                  ? "📈 Getting started"
                  : "🌱 Just begun"}
          </Text>
        </View>
        <ProgressBar
          pct={pct}
          color={barCol}
          height={isYearly ? 10 : isWeekly ? 6 : 8}
        />
      </View>

      {/* Nudge controls */}
      <View style={s.controls}>
        <TouchableOpacity style={s.nudgeBtn} onPress={() => nudge(-10)}>
          <Text style={s.nudgeTxt}>−10</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.nudgeBtn} onPress={() => nudge(-5)}>
          <Text style={s.nudgeTxt}>−5</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[
            s.nudgeBtn,
            { backgroundColor: `${barCol}20`, borderColor: `${barCol}45` },
          ]}
          onPress={() => nudge(5)}
        >
          <Text style={[s.nudgeTxt, { color: barCol }]}>+5</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.nudgeBtn, { backgroundColor: barCol, borderColor: barCol }]}
          onPress={() => nudge(10)}
        >
          <Text style={[s.nudgeTxt, { color: "#000" }]}>+10</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Completed row ─────────────────────────────────────────────
function CompletedRow({ goal, onRemove }) {
  const tf = TIMEFRAMES.find((t) => t.key === goal.timeframe) || TIMEFRAMES[1];
  return (
    <View style={s.completedCard}>
      <View
        style={[
          s.completedCheck,
          { borderColor: GREEN, backgroundColor: `${GREEN}14` },
        ]}
      >
        <Text style={[s.completedCheckTxt, { color: GREEN }]}>✓</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.completedTitle}>{goal.title}</Text>
        <Text style={[s.completedTf, { color: tf.color }]}>{tf.label}</Text>
      </View>
      <View
        style={[
          s.donePill,
          { backgroundColor: `${GREEN}14`, borderColor: `${GREEN}35` },
        ]}
      >
        <Text style={[s.doneTxt, { color: GREEN }]}>DONE</Text>
      </View>
      <TouchableOpacity
        onPress={() => onRemove(goal)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[s.delTxt, { fontSize: 18, marginLeft: 8 }]}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// GOALS SCREEN
// ─────────────────────────────────────────────────────────────
export default function GoalsScreen({ navigation }) {
  const [goals, setGoals] = useState([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [timeframe, setTimeframe] = useState("weekly");

  const load = async () => {
    const g = await goalsStore.list();
    setGoals(Array.isArray(g) ? g : []);
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation]);

  const create = async () => {
    if (!title.trim()) return;
    await goalsStore.create({
      title: title.trim(),
      description: desc.trim(),
      timeframe,
      status: "active",
      progress: 0,
    });
    setTitle("");
    setDesc("");
    setModal(false);
    load();
  };

  const updateProgress = async (goal, delta) => {
    const progress = Math.max(0, Math.min(100, (goal.progress || 0) + delta));
    await goalsStore.update(goal.id, { progress });
    if (progress === 100) {
      Alert.alert("Goal complete! 🎉", `You crushed "${goal.title}"!`, [
        {
          text: "Mark done",
          onPress: async () => {
            await goalsStore.update(goal.id, { status: "completed" });
            load();
          },
        },
        { text: "Keep active", style: "cancel", onPress: load },
      ]);
    } else {
      load();
    }
  };

  const remove = (g) => {
    Alert.alert("Delete goal", `Delete "${g.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await goalsStore.remove(g.id);
          load();
        },
      },
    ]);
  };

  const activeGoals = goals.filter((g) => g.status === "active" || !g.status);
  const completedGoals = goals.filter((g) => g.status === "completed");
  const yearly = activeGoals.filter((g) => g.timeframe === "yearly");
  const monthly = activeGoals.filter((g) => g.timeframe === "monthly");
  const weekly = activeGoals.filter((g) => g.timeframe === "weekly");
  const weeklyAvg = weekly.length
    ? Math.round(
        weekly.reduce((s, g) => s + (g.progress || 0), 0) / weekly.length,
      )
    : 0;
  const avgColor = progressColor(weeklyAvg);

  return (
    // SafeAreaView root with edges top; tab bar handles bottom
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Stats bar */}
        <View style={s.statsBar}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{activeGoals.length}</Text>
            <Text style={s.statLbl}>ACTIVE</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: GREEN }]}>
              {completedGoals.length}
            </Text>
            <Text style={s.statLbl}>DONE</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: avgColor }]}>{weeklyAvg}%</Text>
            <Text style={s.statLbl}>WEEKLY AVG</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
            <Text style={s.addBtnTxt}>+ ADD</Text>
          </TouchableOpacity>
        </View>

        {/* Colour legend */}
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: GREEN }]} />
            <Text style={s.legendTxt}>≥ 80%</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: BLUE }]} />
            <Text style={s.legendTxt}>≥ 50%</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: AMBER }]} />
            <Text style={s.legendTxt}>≥ 25%</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: RED }]} />
            <Text style={s.legendTxt}>{"< 25%"}</Text>
          </View>
        </View>

        {/* Empty state */}
        {goals.length === 0 && (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No goals yet</Text>
            <Text style={s.emptyDesc}>
              Set yearly ambitions, monthly milestones, and weekly targets.
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setModal(true)}>
              <Text style={s.emptyBtnTxt}>SET YOUR FIRST GOAL</Text>
            </TouchableOpacity>
          </View>
        )}

        {yearly.length > 0 && (
          <>
            <Text style={s.secLabel}>YEARLY</Text>
            {yearly.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onUpdate={updateProgress}
                onRemove={remove}
              />
            ))}
          </>
        )}
        {monthly.length > 0 && (
          <>
            <Text style={s.secLabel}>MONTHLY</Text>
            {monthly.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onUpdate={updateProgress}
                onRemove={remove}
              />
            ))}
          </>
        )}
        {weekly.length > 0 && (
          <>
            <Text style={s.secLabel}>WEEKLY</Text>
            {weekly.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onUpdate={updateProgress}
                onRemove={remove}
              />
            ))}
          </>
        )}

        {completedGoals.length > 0 && (
          <>
            <Text style={s.secLabel}>COMPLETED</Text>
            {completedGoals.map((g) => (
              <CompletedRow key={g.id} goal={g} onRemove={remove} />
            ))}
          </>
        )}

        {/* Add modal */}
        <Modal visible={modal} animationType="slide" transparent>
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>NEW GOAL</Text>

              <Text style={s.fieldLabel}>TITLE</Text>
              <TextInput
                style={s.fieldInput}
                value={title}
                onChangeText={setTitle}
                placeholder="What do you want to achieve?"
                placeholderTextColor="#44445a"
                autoFocus
              />

              <Text style={s.fieldLabel}>DESCRIPTION (optional)</Text>
              <TextInput
                style={[s.fieldInput, { height: 68 }]}
                value={desc}
                onChangeText={setDesc}
                multiline
                placeholder="Why does this matter to you?"
                placeholderTextColor="#44445a"
              />

              <Text style={s.fieldLabel}>TIMEFRAME</Text>
              <View style={s.chipRow}>
                {TIMEFRAMES.map((t) => {
                  const active = timeframe === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={[
                        s.chip,
                        active && {
                          backgroundColor: t.color,
                          borderColor: t.color,
                        },
                      ]}
                      onPress={() => setTimeframe(t.key)}
                    >
                      <Text
                        style={[
                          s.chipTxt,
                          active && { color: "#000", fontWeight: "700" },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={s.modalBtns}>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={() => setModal(false)}
                >
                  <Text style={s.cancelTxt}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.createBtn} onPress={create}>
                  <Text style={s.createTxt}>CREATE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "900", color: GREEN },
  statLbl: { fontSize: 8, color: "#44445a", letterSpacing: 1, marginTop: 2 },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  addBtn: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 10,
  },
  addBtnTxt: { color: "#000", fontWeight: "900", fontSize: 12 },

  legend: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 9, color: "#44445a", fontWeight: "600" },

  secLabel: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
    fontSize: 9,
    color: "#44445a",
    letterSpacing: 2,
    fontWeight: "700",
  },

  emptyCard: {
    margin: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e8e8f0",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: "#44445a",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnTxt: {
    color: "#000",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.8,
  },

  // Goal card
  goalCard: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 3,
    overflow: "hidden",
  },
  goalCardLarge: { padding: 20, borderRadius: 22 },
  goalCardSmall: { padding: 12 },
  cornerGlow: {
    position: "absolute",
    top: -25,
    right: -25,
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.08,
  },

  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timeframePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  timeframeTxt: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  delTxt: { color: "#ff4444", fontSize: 24, lineHeight: 28 },

  goalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f0f0f0",
    marginBottom: 4,
  },
  goalTitleLarge: { fontSize: 20, fontWeight: "800" },
  goalTitleSmall: { fontSize: 14 },
  goalDesc: { fontSize: 11, color: "#44445a", lineHeight: 16, marginBottom: 8 },

  progressSection: { marginBottom: 12 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 7,
  },
  progressPct: { fontSize: 22, fontWeight: "900", width: 52 },
  progressPctLarge: { fontSize: 30 },
  progressPctSmall: { fontSize: 18, width: 44 },
  progressStatus: { fontSize: 10, fontWeight: "700" },

  controls: { flexDirection: "row", gap: 6, marginTop: 2 },
  nudgeBtn: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  nudgeTxt: { fontSize: 11, color: "#8888a0", fontWeight: "700" },

  completedCard: {
    marginHorizontal: 14,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  completedCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  completedCheckTxt: { fontSize: 14, fontWeight: "700" },
  completedTitle: { fontSize: 13, color: "#44445a", fontWeight: "500" },
  completedTf: { fontSize: 9, fontWeight: "700", marginTop: 2 },
  donePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  doneTxt: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#0e0e18",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: GREEN,
    letterSpacing: 2,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 9,
    color: "#44445a",
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 14,
  },
  fieldInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
    color: "#e8e8f0",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 14,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipTxt: { color: "#8888a0", fontSize: 13 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cancelTxt: { color: "#8888a0", fontWeight: "700", fontSize: 13 },
  createBtn: {
    flex: 2,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    backgroundColor: GREEN,
  },
  createTxt: { color: "#000", fontWeight: "900", fontSize: 13 },
});
