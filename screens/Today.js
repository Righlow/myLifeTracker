// Screens/Today.js  —  1Life Hub
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { habitsStore, entriesStore, goalsStore, healthStore } from "../store";
import BonsaiGrowthModel from "./BonsaiGrowthModel";
import { COLORS } from "../constants/colors";

const GREEN = COLORS.neonGreen;
const RED = COLORS.neonRed;
const MUTED = COLORS.textMuted;

// ─────────────────────────────────────────────────────────────
// ROUTINE FAB
// ─────────────────────────────────────────────────────────────
const ROUTINE_ITEMS = [
  { key: "task", label: "Task", icon: "✅" },
  { key: "deadline", label: "Deadline", icon: "⏰" },
  { key: "meeting", label: "Meeting", icon: "📅" },
];

function RoutineFAB({ onSelect }) {
  const [open, setOpen] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;
  const anims = useRef(
    ROUTINE_ITEMS.map(() => ({
      y: new Animated.Value(0),
      op: new Animated.Value(0),
    })),
  ).current;

  const toggle = () => {
    const to = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(rotate, {
        toValue: to,
        useNativeDriver: true,
        speed: 20,
      }),
      ...anims.flatMap((a, i) => [
        Animated.spring(a.y, {
          toValue: to,
          useNativeDriver: true,
          speed: 18,
          delay: open ? 0 : i * 50,
        }),
        Animated.timing(a.op, {
          toValue: to,
          duration: open ? 100 : 200 + i * 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    setOpen(!open);
  };

  const close = () => {
    if (!open) return;
    Animated.parallel([
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true, speed: 20 }),
      ...anims.flatMap((a) => [
        Animated.spring(a.y, { toValue: 0, useNativeDriver: true, speed: 20 }),
        Animated.timing(a.op, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    setOpen(false);
  };

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <View style={fab.col} pointerEvents="box-none">
      {ROUTINE_ITEMS.map((item, i) => (
        <Animated.View
          key={item.key}
          pointerEvents={open ? "auto" : "none"}
          style={[
            fab.fanItem,
            {
              opacity: anims[i].op,
              position: "absolute",
              bottom: 58 + i * 54,
              right: 0,
              transform: [
                {
                  translateY: anims[i].y.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={fab.fanLabel}>{item.label}</Text>
          <TouchableOpacity
            style={fab.fanBtn}
            onPress={() => {
              close();
              onSelect(item.key);
            }}
            activeOpacity={0.8}
          >
            <Text style={fab.fanIcon}>{item.icon}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
      <TouchableOpacity style={fab.btn} onPress={toggle} activeOpacity={0.85}>
        <Animated.Text style={[fab.icon, { transform: [{ rotate: spin }] }]}>
          📋
        </Animated.Text>
      </TouchableOpacity>
      <Text style={fab.btnLabel}>ROUTINE</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PHYSICAL FAB
// ─────────────────────────────────────────────────────────────
const PHYSICAL_ITEMS = [
  { key: "diet", label: "Diet", icon: "🥗" },
  { key: "sleep", label: "Sleep", icon: "😴" },
  { key: "gym", label: "Gym", icon: "💪" },
];

function PhysicalFAB({ onSelect }) {
  const [open, setOpen] = useState(false);
  const anims = useRef(
    PHYSICAL_ITEMS.map(() => ({
      y: new Animated.Value(0),
      op: new Animated.Value(0),
    })),
  ).current;

  const toggle = () => {
    const to = open ? 0 : 1;
    Animated.parallel([
      ...anims.flatMap((a, i) => [
        Animated.spring(a.y, {
          toValue: to,
          useNativeDriver: true,
          speed: 18,
          delay: open ? 0 : i * 50,
        }),
        Animated.timing(a.op, {
          toValue: to,
          duration: open ? 100 : 200 + i * 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    setOpen(!open);
  };

  const close = () => {
    if (!open) return;
    Animated.parallel([
      ...anims.flatMap((a) => [
        Animated.spring(a.y, { toValue: 0, useNativeDriver: true, speed: 20 }),
        Animated.timing(a.op, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    setOpen(false);
  };

  return (
    <View style={fab.col} pointerEvents="box-none">
      {PHYSICAL_ITEMS.map((item, i) => (
        <Animated.View
          key={item.key}
          pointerEvents={open ? "auto" : "none"}
          style={[
            fab.fanItem,
            {
              opacity: anims[i].op,
              position: "absolute",
              bottom: 58 + i * 54,
              right: 0,
              transform: [
                {
                  translateY: anims[i].y.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={fab.fanLabel}>{item.label}</Text>
          <TouchableOpacity
            style={[
              fab.fanBtn,
              { borderColor: `${GREEN}40`, backgroundColor: `${GREEN}12` },
            ]}
            onPress={() => {
              close();
              onSelect(item.key);
            }}
            activeOpacity={0.8}
          >
            <Text style={fab.fanIcon}>{item.icon}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
      <TouchableOpacity
        style={[
          fab.btn,
          { backgroundColor: `${GREEN}18`, borderColor: `${GREEN}50` },
        ]}
        onPress={toggle}
        activeOpacity={0.85}
      >
        <Text style={fab.icon}>🏃</Text>
      </TouchableOpacity>
      <Text style={[fab.btnLabel, { color: GREEN }]}>PHYSICAL</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// QUICK ADD MODAL — only for tasks now
// ─────────────────────────────────────────────────────────────
function QuickAddModal({ visible, onClose, onSave }) {
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      date: "",
      type: "task",
      id: Date.now().toString(),
      done: false,
    });
    setTitle("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>NEW TASK</Text>
          <Text style={m.fieldLabel}>TITLE</Text>
          <TextInput
            style={m.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            placeholderTextColor="#44445a"
            autoFocus
          />
          <View style={m.btns}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
              <Text style={m.cancelTxt}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.saveBtn} onPress={handleSave}>
              <Text style={m.saveTxt}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// NOTICES SECTION
// ─────────────────────────────────────────────────────────────
const NOTICE_CONFIG = {
  deadline: { icon: "⏰", color: RED, priority: 1 },
  meeting: { icon: "📅", color: COLORS.neonAmber || "#fbbf24", priority: 2 },
  task: { icon: "✅", color: GREEN, priority: 3 },
};

function NoticesSection({ tasks, onToggle, onDelete, navigation }) {
  const active = tasks
    .filter((t) => !t.done)
    .sort((a, b) => {
      const pa = NOTICE_CONFIG[a.type]?.priority || 3;
      const pb = NOTICE_CONFIG[b.type]?.priority || 3;
      return pa - pb;
    });

  if (active.length === 0) return null;

  return (
    <View style={s.noticesCard}>
      <Text style={s.noticesTitle}>NOTICES</Text>
      {active.map((task, i) => {
        const cfg = NOTICE_CONFIG[task.type] || NOTICE_CONFIG.task;
        return (
          <View key={task.id}>
            <TouchableOpacity
              style={s.noticeRow}
              onPress={() => {
                if (task.type === "meeting") navigation.navigate("Meetings");
                if (task.type === "deadline") navigation.navigate("Deadlines");
                if (task.type === "task") onToggle(task.id);
              }}
              onLongPress={() => onDelete(task.id, task.title)}
              activeOpacity={0.7}
            >
              <View style={[s.noticeDot, { backgroundColor: cfg.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.noticeTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                {task.date ? (
                  <Text style={s.noticeDate}>{task.date}</Text>
                ) : null}
              </View>
              <View
                style={[
                  s.noticePill,
                  {
                    borderColor: `${cfg.color}40`,
                    backgroundColor: `${cfg.color}12`,
                  },
                ]}
              >
                <Text style={[s.noticePillTxt, { color: cfg.color }]}>
                  {task.type.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
            {i < active.length - 1 && <View style={s.divider} />}
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// REUSABLE
// ─────────────────────────────────────────────────────────────
function SectionHeader({ label, right }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionLabel}>{label}</Text>
      {right && <Text style={s.sectionRight}>{right}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// TODAY SCREEN
// ─────────────────────────────────────────────────────────────
const TASKS_KEY = "today_tasks";

export default function TodayScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [health, setHealth] = useState(null);
  const [completions, setCompletions] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const loadTasks = async () => {
    try {
      const raw = await AsyncStorage.getItem(TASKS_KEY);
      setTasks(raw ? JSON.parse(raw) : []);
    } catch {
      setTasks([]);
    }
  };

  const saveTasks = async (updated) => {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
    setTasks(updated);
  };

  const addTask = async (task) => {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    const all = raw ? JSON.parse(raw) : [];
    await saveTasks([...all, task]);
  };

  const toggleTask = async (id) => {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    const all = raw ? JSON.parse(raw) : [];
    await saveTasks(
      all.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const deleteTask = (id, title) => {
    Alert.alert("Delete", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const raw = await AsyncStorage.getItem(TASKS_KEY);
          const all = raw ? JSON.parse(raw) : [];
          await saveTasks(all.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const load = useCallback(async () => {
    const [h, e, g, todayHealth] = await Promise.all([
      habitsStore.list(),
      entriesStore.list(),
      goalsStore.list(),
      healthStore.getToday(),
    ]);
    setHabits((Array.isArray(h) ? h : []).filter((x) => x.is_active !== false));
    setEntries(Array.isArray(e) ? e : []);
    setGoals(Array.isArray(g) ? g : []);
    setHealth(todayHealth);
    const todayEntry = (Array.isArray(e) ? e : []).find(
      (x) => x.date === todayStr,
    );
    if (todayEntry?.habit_completions) {
      const comp = {};
      todayEntry.habit_completions.forEach((c) => {
        comp[c.habit_id] = c.completed;
      });
      setCompletions(comp);
    }
    loadTasks();
  }, [todayStr]);

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

  // ✅ Updated handleFabSelect
  const handleFabSelect = (key) => {
    if (["diet", "gym", "sleep"].includes(key)) {
      navigation.navigate("Physical");
    } else if (key === "meeting") {
      navigation.navigate("Meetings");
    } else if (key === "deadline") {
      navigation.navigate("Deadlines");
    } else {
      setModalOpen(true);
    }
  };

  // Scores
  const sleepScore = health ? Math.min((health.sleep || 0) / 8, 1) : 0;
  const waterScore = health ? Math.min((health.water || 0) / 8, 1) : 0;
  const gymScore = health ? Math.min((health.movement || 0) / 60, 1) : 0;
  const healthScore = (sleepScore + waterScore + gymScore) / 3;

  const completedCount = habits.filter((h) => !!completions[h.id]).length;
  const habitScore = habits.length ? completedCount / habits.length : 0;

  const weeklyGoals = goals.filter(
    (g) => g.timeframe === "weekly" && (g.status === "active" || !g.status),
  );
  const goalScore = weeklyGoals.length
    ? weeklyGoals.reduce((s, g) => s + (g.progress || 0), 0) /
      weeklyGoals.length /
      100
    : 0;

  const plantXP = Math.round(
    ((habitScore + healthScore + goalScore) / 3) * 500,
  );
  const bloomedDomains = [
    ...new Set(
      habits.filter((h) => completions[h.id] && h.domain).map((h) => h.domain),
    ),
  ];

  const streakCount = (() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const hit = entries.some(
        (e) =>
          e.date === key &&
          Array.isArray(e.habit_completions) &&
          e.habit_completions.some((c) => c.completed),
      );
      if (hit) count++;
      else if (i > 0) break;
    }
    return count;
  })();

  const physicalBars = [
    { label: "DIET", score: Math.round(waterScore * 100) },
    { label: "GYM", score: Math.round(gymScore * 100) },
    { label: "SLEEP", score: Math.round(sleepScore * 100) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView style={s.root} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 220 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={GREEN}
            />
          }
        >
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.title}>1LIFE HUB</Text>
              <Text style={s.date}>
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                })}
              </Text>
            </View>
            <View style={[s.streakPill, streakCount > 0 && s.streakPillActive]}>
              <Text style={s.streakNum}>{streakCount}</Text>
              <Text style={s.streakLbl}> day streak</Text>
            </View>
          </View>

          {/* Plant card + physical bars */}
          <View style={s.plantCard}>
            <BonsaiGrowthModel
              totalXP={plantXP}
              bloomedDomains={bloomedDomains}
              maxXP={500}
            />
            <View style={s.physBars}>
              {physicalBars.map((bar) => (
                <View key={bar.label} style={s.physBarRow}>
                  <Text style={s.physBarLabel}>{bar.label}</Text>
                  <View style={s.physBarTrack}>
                    <View
                      style={[
                        s.physBarFill,
                        {
                          width: `${bar.score}%`,
                          backgroundColor: bar.score >= 50 ? GREEN : RED,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      s.physBarPct,
                      { color: bar.score >= 50 ? GREEN : RED },
                    ]}
                  >
                    {bar.score}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Notices */}
          <SectionHeader label="NOTICES" />
          <NoticesSection
            tasks={tasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            navigation={navigation}
          />
          {tasks.filter((t) => !t.done).length === 0 && (
            <View style={s.emptyNotices}>
              <Text style={s.emptyNoticesTxt}>
                No notices — you're all clear 🎯
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Two FABs */}
      <View style={fab.row} pointerEvents="box-none">
        <RoutineFAB onSelect={handleFabSelect} />
        <PhysicalFAB onSelect={handleFabSelect} />
      </View>

      {/* Task modal only */}
      <QuickAddModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTask}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
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
  date: { fontSize: 11, color: MUTED, marginTop: 3 },

  streakPill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  streakPillActive: {
    backgroundColor: "rgba(0,255,148,0.08)",
    borderColor: "rgba(0,255,148,0.2)",
  },
  streakNum: { fontSize: 18, fontWeight: "900", color: GREEN },
  streakLbl: { fontSize: 10, color: MUTED },

  plantCard: {
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  physBars: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4, gap: 8 },
  physBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  physBarLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 1.5,
    fontWeight: "700",
    width: 38,
  },
  physBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 4,
    overflow: "hidden",
  },
  physBarFill: { height: "100%", borderRadius: 4 },
  physBarPct: {
    fontSize: 10,
    fontWeight: "800",
    width: 34,
    textAlign: "right",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
  },
  sectionRight: { fontSize: 11, color: GREEN, fontWeight: "800" },

  noticesCard: {
    marginHorizontal: 14,
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  noticesTitle: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  noticeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  noticeTitle: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  noticeDate: { fontSize: 10, color: MUTED, marginTop: 2 },
  noticePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticePillTxt: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },

  emptyNotices: {
    marginHorizontal: 14,
    marginBottom: 4,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  emptyNoticesTxt: { fontSize: 12, color: MUTED },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginHorizontal: 16,
  },
});

// ─────────────────────────────────────────────────────────────
const fab = StyleSheet.create({
  row: {
    position: "absolute",
    bottom: 34,
    right: 24,
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-end",
    zIndex: 999,
  },
  col: { alignItems: "center", position: "relative" },
  btn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  icon: { fontSize: 22 },
  btnLabel: {
    fontSize: 8,
    color: MUTED,
    marginTop: 4,
    letterSpacing: 1,
    fontWeight: "700",
  },
  fanItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  fanLabel: {
    fontSize: 11,
    color: COLORS.textDim,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  fanBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  fanIcon: { fontSize: 20 },
});

// ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0e0e18",
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
  title: {
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
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
    color: "#e8e8f0",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 14,
  },
  btns: { flexDirection: "row", gap: 10, marginTop: 24 },
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
  saveBtn: {
    flex: 2,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    backgroundColor: GREEN,
  },
  saveTxt: { color: "#000", fontWeight: "900", fontSize: 13 },
});
