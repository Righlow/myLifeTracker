// screens/Today.js — 1Life Hub
// Palette: #130101 bg | #00B85C green | #441FFF blue | #E8001C red | #FF4B0A orange | #FFFFFF white
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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { habitsStore, entriesStore, goalsStore, healthStore } from "../store";
import BonsaiGrowthModel from "./BonsaiGrowthModel";
import { COLORS } from "../constants/colors";

const BG = "#130101";
const GREEN = "#00B85C";
const BLUE = "#441FFF";
const RED = "#E8001C";
const ORANGE = "#FF4B0A";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.35)";
const DIM = "rgba(255,255,255,0.65)";

const { width: SW, height: SH } = Dimensions.get("window");

const ROUTINE_ITEMS = [
  { key: "task", label: "Task", icon: "checkmark-done-outline" },
  { key: "deadline", label: "Deadline", icon: "alarm-outline" },
  { key: "meeting", label: "Meeting", icon: "calendar-outline" },
];
const PHYSICAL_ITEMS = [
  { key: "diet", label: "Diet", icon: "nutrition-outline" },
  { key: "sleep", label: "Sleep", icon: "moon-outline" },
  { key: "gym", label: "Gym", icon: "barbell-outline" },
];

// ── FAB OVERLAY ──────────────────────────────────────────────
function FabOverlay({
  items,
  anchorX,
  anchorY,
  open,
  onSelect,
  onClose,
  iconColor,
  btnBg,
}) {
  const RADIUS = 125;
  const ITEM_SZ = 44;
  const anims = useRef(items.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (open) {
      Animated.stagger(
        55,
        anims.map((a) =>
          Animated.spring(a, {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 10,
          }),
        ),
      ).start();
    } else {
      Animated.parallel(
        anims.map((a) =>
          Animated.spring(a, {
            toValue: 0,
            useNativeDriver: true,
            speed: 24,
            bounciness: 0,
          }),
        ),
      ).start();
    }
  }, [open]);

  const isLeft = anchorX < SW / 2;
  const getPos = (i) => {
    const t = items.length === 1 ? 0.5 : i / (items.length - 1);
    const deg = 100 + t * ((isLeft ? 10 : 170) - 100);
    const rad = (deg * Math.PI) / 180;
    return {
      cx: anchorX + Math.cos(rad) * RADIUS,
      cy: anchorY - Math.sin(rad) * RADIUS,
    };
  };

  if (!open && anims.every((a) => a._value === 0)) return null;

  return (
    <View
      pointerEvents={open ? "box-none" : "none"}
      style={StyleSheet.absoluteFillObject}
    >
      {items.map((item, i) => {
        const { cx, cy } = getPos(i);
        const prog = anims[i];
        return (
          <Animated.View
            key={item.key}
            style={{
              position: "absolute",
              left: cx - ITEM_SZ / 2,
              top: cy - ITEM_SZ / 2,
              transform: [
                {
                  translateX: prog.interpolate({
                    inputRange: [0, 1],
                    outputRange: [anchorX - cx, 0],
                  }),
                },
                {
                  translateY: prog.interpolate({
                    inputRange: [0, 1],
                    outputRange: [anchorY - cy, 0],
                  }),
                },
                {
                  scale: prog.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
              opacity: prog.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0, 1, 1],
              }),
              flexDirection: isLeft ? "row" : "row-reverse",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TouchableOpacity
              style={[
                st.fanBtn,
                { backgroundColor: btnBg, borderColor: iconColor },
              ]}
              onPress={() => {
                onClose();
                onSelect(item.key);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name={item.icon} size={18} color={iconColor} />
            </TouchableOpacity>
            <View style={st.labelPill}>
              <Text style={[st.labelTxt, { color: WHITE }]}>{item.label}</Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

function FabButton({ icon, label, btnStyle, iconColor, onPress }) {
  return (
    <View style={{ alignItems: "center" }}>
      <TouchableOpacity
        style={[st.fab, btnStyle]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </TouchableOpacity>
      <Text style={[st.fabLabel, { color: iconColor }]}>{label}</Text>
    </View>
  );
}

// ── NOTICES ───────────────────────────────────────────────────
const NOTICE_CONFIG = {
  deadline: { icon: "alarm-outline", color: ORANGE, priority: 1 },
  meeting: { icon: "calendar-outline", color: BLUE, priority: 2 },
  task: { icon: "checkmark-done-outline", color: GREEN, priority: 3 },
};

function NoticesSection({ tasks, onToggle, onDelete, navigation }) {
  const active = tasks
    .filter((t) => !t.done)
    .sort(
      (a, b) =>
        (NOTICE_CONFIG[a.type]?.priority || 3) -
        (NOTICE_CONFIG[b.type]?.priority || 3),
    );
  if (!active.length) return null;
  return (
    <View style={s.noticesCard}>
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
                  <Text style={s.noticeSub}>{task.date}</Text>
                ) : null}
              </View>
              <View
                style={[
                  s.noticePill,
                  {
                    borderColor: `${cfg.color}50`,
                    backgroundColor: `${cfg.color}18`,
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

// ── PULSE CARD ────────────────────────────────────────────────
function PulseCard({ bars, overall }) {
  const overallColor = overall >= 70 ? GREEN : overall >= 40 ? ORANGE : RED;
  return (
    <View style={s.pulseCard}>
      <View style={s.pulseHeader}>
        <Text style={s.pulseTitle}>TODAY'S PULSE</Text>
        <Text style={[s.pulseScore, { color: overallColor }]}>{overall}%</Text>
      </View>
      {bars.map((bar) => {
        const c = bar.score >= 70 ? GREEN : bar.score >= 40 ? ORANGE : RED;
        return (
          <View key={bar.label} style={s.pulseRow}>
            <Text style={s.pulseLabel}>{bar.label}</Text>
            <View style={s.pulseTrack}>
              <View
                style={[
                  s.pulseFill,
                  { width: `${bar.score}%`, backgroundColor: c },
                ]}
              />
            </View>
            <Text style={[s.pulsePct, { color: c }]}>{bar.score}%</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── QUICK ADD MODAL ───────────────────────────────────────────
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
      <View style={mo.overlay}>
        <View style={mo.sheet}>
          <View style={mo.handle} />
          <Text style={mo.title}>NEW TASK</Text>
          <TextInput
            style={mo.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            placeholderTextColor="rgba(255,255,255,0.2)"
            autoFocus
            color={WHITE}
          />
          <View style={mo.btns}>
            <TouchableOpacity style={mo.cancelBtn} onPress={onClose}>
              <Text style={mo.cancelTxt}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={mo.saveBtn} onPress={handleSave}>
              <Text style={mo.saveTxt}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── INLINE STORAGE ────────────────────────────────────────────
const _tasksGet = async () => {
  try {
    const r = await AsyncStorage.getItem("today_tasks");
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
};
const _tasksSave = async (items) => {
  try {
    await AsyncStorage.setItem("today_tasks", JSON.stringify(items));
  } catch {}
};
const _routineGet = async () => {
  try {
    const r = await AsyncStorage.getItem("routine_items");
    return r ? JSON.parse(r) : { meetings: [], deadlines: [], tasks: [] };
  } catch {
    return { meetings: [], deadlines: [], tasks: [] };
  }
};

// ── TODAY SCREEN ──────────────────────────────────────────────
export default function TodayScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [health, setHealth] = useState(null);
  const [completions, setCompletions] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [routineItems, setRoutineItems] = useState({
    meetings: [],
    deadlines: [],
    tasks: [],
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [routineOpen, setRoutineOpen] = useState(false);
  const [physicalOpen, setPhysicalOpen] = useState(false);

  const prevXP = useRef(0);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [xpGain, setXpGain] = useState(0);

  const FAB_HALF = 26;
  const routineAnchor = { x: 24 + FAB_HALF, y: SH - 34 - FAB_HALF };
  const physicalAnchor = { x: SW - 24 - FAB_HALF, y: SH - 34 - FAB_HALF };
  const todayStr = new Date().toISOString().split("T")[0];

  const loadTasks = async () => {
    try {
      setTasks(await _tasksGet());
    } catch {
      setTasks([]);
    }
  };
  const saveTasks = async (u) => {
    await _tasksSave(u);
    setTasks(u);
  };
  const addTask = async (t) => {
    const all = await _tasksGet();
    await saveTasks([...all, t]);
  };
  const toggleTask = async (id) => {
    const all = await _tasksGet();
    await saveTasks(
      all.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };
  const deleteTask = (id, title) =>
    Alert.alert("Delete", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const all = await _tasksGet();
          await saveTasks(all.filter((t) => t.id !== id));
        },
      },
    ]);

  const loadRef = useRef(null);
  loadRef.current = async () => {
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
    const te = (Array.isArray(e) ? e : []).find((x) => x.date === todayStr);
    if (te?.habit_completions) {
      const c = {};
      te.habit_completions.forEach((x) => {
        c[x.habit_id] = x.completed;
      });
      setCompletions(c);
    }
    loadTasks();
    try {
      const { meetings: m, deadlines: d, tasks: t } = await _routineGet();
      setRoutineItems({
        meetings: m || [],
        deadlines: d || [],
        tasks: t || [],
      });
    } catch {
      setRoutineItems({ meetings: [], deadlines: [], tasks: [] });
    }
  };

  const load = useCallback(() => loadRef.current?.(), []);
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const u = navigation.addListener("focus", load);
    return u;
  }, [navigation, load]);
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleRoutine = () => {
    setPhysicalOpen(false);
    setRoutineOpen((v) => !v);
  };
  const togglePhysical = () => {
    setRoutineOpen(false);
    setPhysicalOpen((v) => !v);
  };
  const handleRoutineSelect = (key) => {
    setRoutineOpen(false);
    navigation.navigate("Routine", { defaultTab: key });
  };
  const handlePhysicalSelect = (key) => {
    setPhysicalOpen(false);
    navigation.navigate("Physical", { defaultTab: key });
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
  const allRoutine = [
    ...(routineItems.meetings || []),
    ...(routineItems.deadlines || []),
    ...(routineItems.tasks || []),
  ];
  const routineScore =
    allRoutine.length > 0
      ? allRoutine.filter((i) => i.done).length / allRoutine.length
      : 0;
  const rawScore =
    healthScore * 0.35 +
    habitScore * 0.3 +
    routineScore * 0.25 +
    goalScore * 0.1;
  const plantXP = Math.round(rawScore * 500);
  const bloomed = [
    ...new Set(
      habits.filter((h) => completions[h.id] && h.domain).map((h) => h.domain),
    ),
  ];
  const overallPct = Math.round(
    ((healthScore + habitScore + routineScore) / 3) * 100,
  );

  useEffect(() => {
    if (plantXP > 0 && prevXP.current > 0 && plantXP > prevXP.current) {
      const gained = plantXP - prevXP.current;
      setXpGain(gained);
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
    if (plantXP > 0) prevXP.current = plantXP;
  }, [plantXP]);

  const streakCount = (() => {
    let c = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const hit = entries.some(
        (e) =>
          e.date === d.toISOString().split("T")[0] &&
          Array.isArray(e.habit_completions) &&
          e.habit_completions.some((x) => x.completed),
      );
      if (hit) c++;
      else if (i > 0) break;
    }
    return c;
  })();

  const healthNotices = health
    ? [
        (health.sleep || 0) < 8 && {
          id: "h-sleep",
          title: `Sleep: ${health.sleep || 0}h — goal is 8h`,
          type: "deadline",
          date: "",
          done: false,
        },
        (health.water || 0) < 8 && {
          id: "h-water",
          title: `Water: ${health.water || 0} glasses — goal is 8`,
          type: "task",
          date: "",
          done: false,
        },
        (health.movement || 0) < 60 && {
          id: "h-gym",
          title: `Movement: ${health.movement || 0}min — goal 60min`,
          type: "task",
          date: "",
          done: false,
        },
      ].filter(Boolean)
    : [];

  const allNotices = [...(Array.isArray(tasks) ? tasks : []), ...healthNotices];

  const bars = [
    { label: "PHYSICAL", score: Math.round(healthScore * 100) },
    { label: "ROUTINE", score: Math.round(routineScore * 100) },
    { label: "HABITS", score: Math.round(habitScore * 100) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView style={s.root} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={GREEN}
            />
          }
        >
          {/* ── GREEN HEADER BLOCK ── */}
          <View style={s.headerBlock}>
            <View style={s.headerInner}>
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
              <View style={s.streakPill}>
                <Text style={s.streakNum}>{streakCount}</Text>
                <Text style={s.streakLbl}> DAY STREAK</Text>
              </View>
            </View>
          </View>

          {/* ── BONSAI ── */}
          <View style={s.bonsaiCard}>
            <BonsaiGrowthModel
              totalXP={plantXP}
              bloomedDomains={bloomed}
              maxXP={500}
            />
          </View>

          {/* ── XP TOAST ── */}
          <Animated.View
            style={[s.xpToast, { opacity: toastOpacity }]}
            pointerEvents="none"
          >
            <Ionicons name="leaf-outline" size={13} color={GREEN} />
            <Text style={s.xpToastTxt}>
              +{xpGain} XP — your plant is growing!
            </Text>
          </Animated.View>

          {/* ── PULSE CARD (blue block) ── */}
          <PulseCard bars={bars} overall={overallPct} />

          {/* ── NOTICES ── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionLabel}>NOTICES</Text>
          </View>
          <NoticesSection
            tasks={allNotices}
            onToggle={toggleTask}
            onDelete={deleteTask}
            navigation={navigation}
          />
          {allNotices.filter((t) => !t.done).length === 0 && (
            <View style={s.emptyNotices}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={GREEN}
                style={{ marginBottom: 6 }}
              />
              <Text style={s.emptyNoticesTxt}>You are all clear</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── FABs ── */}
      <View style={s.fabRow} pointerEvents="box-none">
        <FabButton
          icon={routineOpen ? "close" : "list-outline"}
          label="ROUTINE"
          iconColor={DIM}
          btnStyle={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.15)",
          }}
          onPress={toggleRoutine}
        />
        <FabButton
          icon={physicalOpen ? "close" : "heart-outline"}
          label="PHYSICAL"
          iconColor={RED}
          btnStyle={{ backgroundColor: `${RED}20`, borderColor: `${RED}60` }}
          onPress={togglePhysical}
        />
      </View>

      <FabOverlay
        items={ROUTINE_ITEMS}
        anchorX={routineAnchor.x}
        anchorY={routineAnchor.y}
        open={routineOpen}
        onSelect={handleRoutineSelect}
        onClose={() => setRoutineOpen(false)}
        iconColor={WHITE}
        btnBg="rgba(255,255,255,0.1)"
      />

      <FabOverlay
        items={PHYSICAL_ITEMS}
        anchorX={physicalAnchor.x}
        anchorY={physicalAnchor.y}
        open={physicalOpen}
        onSelect={handlePhysicalSelect}
        onClose={() => setPhysicalOpen(false)}
        iconColor={WHITE}
        btnBg={RED}
      />

      <QuickAddModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTask}
      />
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  headerBlock: {
    backgroundColor: GREEN,
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 20,
    overflow: "hidden",
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
  },
  title: {
    fontSize: 26,
    fontFamily: "Orbitron",
    color: BG,
    letterSpacing: 2,
    lineHeight: 28,
  },
  date: {
    fontSize: 11,
    color: "rgba(0,0,0,0.45)",
    fontWeight: "600",
    marginTop: 3,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(0,0,0,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  streakNum: { fontSize: 22, fontWeight: "900", color: BG },
  streakLbl: {
    fontSize: 9,
    color: "rgba(0,0,0,0.45)",
    fontWeight: "700",
    letterSpacing: 1,
  },

  bonsaiCard: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },

  pulseCard: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: BLUE,
    borderRadius: 20,
    padding: 16,
  },
  pulseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  pulseTitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 2.5,
    fontWeight: "700",
  },
  pulseScore: { fontSize: 22, fontWeight: "900", color: WHITE },
  pulseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  pulseLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    letterSpacing: 1.5,
    width: 58,
  },
  pulseTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    overflow: "hidden",
  },
  pulseFill: { height: "100%", borderRadius: 3 },
  pulsePct: { fontSize: 11, fontWeight: "800", width: 36, textAlign: "right" },

  sectionHeader: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  sectionLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 3,
    fontWeight: "700",
  },

  noticesCard: {
    marginHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  noticeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  noticeTitle: { fontSize: 13, fontWeight: "600", color: WHITE },
  noticeSub: { fontSize: 10, color: MUTED, marginTop: 2 },
  noticePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  noticePillTxt: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 14,
  },

  emptyNotices: {
    marginHorizontal: 14,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  emptyNoticesTxt: { fontSize: 12, color: MUTED, fontWeight: "500" },

  xpToast: {
    position: "absolute",
    alignSelf: "center",
    top: 210,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: `${GREEN}50`,
    zIndex: 999,
  },
  xpToastTxt: { fontSize: 12, fontWeight: "700", color: GREEN },

  fabRow: {
    position: "absolute",
    bottom: 34,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    alignItems: "center",
    zIndex: 100,
  },
});

const st = StyleSheet.create({
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  fabLabel: {
    fontSize: 8,
    marginTop: 4,
    letterSpacing: 1.5,
    fontWeight: "700",
    textAlign: "center",
  },
  fanBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  labelPill: {
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  labelTxt: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
});

const mo = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1a0101",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
    fontSize: 18,
    fontFamily: "Orbitron",
    color: GREEN,
    letterSpacing: 2,
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 15,
  },
  btns: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cancelTxt: { color: DIM, fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  saveBtn: {
    flex: 2,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    backgroundColor: GREEN,
  },
  saveTxt: { color: BG, fontWeight: "900", fontSize: 13, letterSpacing: 1 },
});
