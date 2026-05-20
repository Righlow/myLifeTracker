// screens/HabitsScreen.js — 1Life Hub | GREEN identity screen
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { habitsStore, entriesStore } from "../store";

const BG = "#0A0E27";
const RED = "#CC0000";
const BLUE = "#0047AB";
const GREEN = "#00C060";
const ORANGE = "#FF4B0A";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.55)";
const DIM = "rgba(255,255,255,0.80)";

const DOMAINS = [
  { key: "physical", label: "Physical", icon: "heart-outline", color: RED },
  { key: "mental", label: "Mental", icon: "brain-outline", color: BLUE },
  {
    key: "emotional",
    label: "Emotional",
    icon: "happy-outline",
    color: ORANGE,
  },
  { key: "personal", label: "Personal", icon: "person-outline", color: GREEN },
];

const FREQUENCIES = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
];

// ── ADD HABIT MODAL ───────────────────────────────────────────
function AddHabitModal({ visible, onClose, onSave }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("personal");
  const [freq, setFreq] = useState("daily");

  const reset = () => {
    setName("");
    setDomain("personal");
    setFreq("daily");
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), domain, frequency: freq, is_active: true });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={mo.overlay}
      >
        <TouchableOpacity
          style={mo.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={mo.sheet}>
          <View style={mo.handle} />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <Ionicons name="leaf-outline" size={20} color={GREEN} />
            <Text style={mo.title}>NEW HABIT</Text>
          </View>

          <Text style={mo.label}>HABIT NAME</Text>
          <TextInput
            style={mo.input}
            placeholder="e.g. Morning walk, Read 20 pages..."
            placeholderTextColor={MUTED}
            value={name}
            onChangeText={setName}
            autoFocus
            color={WHITE}
          />

          <Text style={mo.label}>AREA OF LIFE</Text>
          <View style={mo.grid}>
            {DOMAINS.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[
                  mo.domainBtn,
                  domain === d.key && {
                    backgroundColor: `${d.color}30`,
                    borderColor: d.color,
                  },
                ]}
                onPress={() => setDomain(d.key)}
              >
                <Ionicons
                  name={d.icon}
                  size={16}
                  color={domain === d.key ? d.color : MUTED}
                />
                <Text
                  style={[
                    mo.domainTxt,
                    domain === d.key && { color: d.color, fontWeight: "700" },
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={mo.label}>FREQUENCY</Text>
          <View style={mo.freqRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  mo.freqBtn,
                  freq === f.key && {
                    backgroundColor: `${GREEN}25`,
                    borderColor: GREEN,
                  },
                ]}
                onPress={() => setFreq(f.key)}
              >
                <Text
                  style={[
                    mo.freqTxt,
                    freq === f.key && { color: GREEN, fontWeight: "800" },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={mo.actions}>
            <TouchableOpacity style={mo.cancelBtn} onPress={handleClose}>
              <Text style={mo.cancelTxt}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mo.saveBtn, !name.trim() && { opacity: 0.4 }]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Ionicons name="checkmark" size={16} color={WHITE} />
              <Text style={mo.saveTxt}>SAVE HABIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── HABIT CARD ────────────────────────────────────────────────
function HabitCard({ habit, done, streak, onToggle, onDelete }) {
  const dom = DOMAINS.find((d) => d.key === habit.domain) || DOMAINS[3];
  return (
    <View style={[h.card, done && h.cardDone]}>
      <TouchableOpacity
        style={[
          h.check,
          { borderColor: done ? dom.color : "rgba(255,255,255,0.20)" },
          done && { backgroundColor: dom.color },
        ]}
        onPress={() => onToggle(habit.id)}
        activeOpacity={0.7}
      >
        {done && <Ionicons name="checkmark" size={14} color={WHITE} />}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={[h.name, done && h.nameDone]}>{habit.name}</Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 3,
          }}
        >
          <View style={[h.domainPill, { backgroundColor: `${dom.color}20` }]}>
            <Ionicons name={dom.icon} size={10} color={dom.color} />
            <Text style={[h.domainTxt, { color: dom.color }]}>{dom.label}</Text>
          </View>
          {streak > 0 && (
            <View style={h.streakPill}>
              <Ionicons name="flame-outline" size={10} color={ORANGE} />
              <Text style={h.streakTxt}>{streak}d streak</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => onDelete(habit.id, habit.name)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-outline" size={18} color={MUTED} />
      </TouchableOpacity>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function HabitsScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [streaks, setStreaks] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    const [allHabits, allEntries] = await Promise.all([
      habitsStore.list(),
      entriesStore.list(),
    ]);

    const active = (Array.isArray(allHabits) ? allHabits : []).filter(
      (h) => h.is_active !== false,
    );
    setHabits(active);

    // Today's completions
    const todayEntry = (Array.isArray(allEntries) ? allEntries : []).find(
      (e) => e.date === todayStr,
    );
    const c = {};
    if (todayEntry?.habit_completions) {
      todayEntry.habit_completions.forEach((x) => {
        c[x.habit_id] = x.completed;
      });
    }
    setCompletions(c);

    // Calculate streaks per habit
    const sorted = [...(Array.isArray(allEntries) ? allEntries : [])].sort(
      (a, b) => b.date.localeCompare(a.date),
    );
    const s = {};
    active.forEach((habit) => {
      let count = 0;
      for (let i = 0; i < 60; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const entry = sorted.find((e) => e.date === key);
        const done = entry?.habit_completions?.find(
          (x) => x.habit_id === habit.id && x.completed,
        );
        if (done) count++;
        else if (i > 0) break;
      }
      s[habit.id] = count;
    });
    setStreaks(s);
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

  const toggleHabit = async (id) => {
    const newDone = !completions[id];
    const updated = { ...completions, [id]: newDone };
    setCompletions(updated);

    // Save to entries store
    const allEntries = await entriesStore.list();
    const existing = allEntries.find((e) => e.date === todayStr);
    const prevCompletions = existing?.habit_completions || [];
    const newCompletions = habits.map((h) => ({
      habit_id: h.id,
      completed: h.id === id ? newDone : !!updated[h.id],
    }));

    if (existing) {
      await entriesStore.update(existing.id, {
        habit_completions: newCompletions,
      });
    } else {
      await entriesStore.create({
        date: todayStr,
        habit_completions: newCompletions,
      });
    }
  };

  const saveHabit = async (data) => {
    await habitsStore.create(data);
    await load();
  };

  const deleteHabit = (id, name) => {
    Alert.alert("Delete Habit", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await habitsStore.remove(id);
          await load();
        },
      },
    ]);
  };

  const completedCount = habits.filter((h) => completions[h.id]).length;
  const pct = habits.length
    ? Math.round((completedCount / habits.length) * 100)
    : 0;
  const scoreColor = pct >= 70 ? GREEN : pct >= 40 ? ORANGE : RED;

  const pending = habits.filter((h) => !completions[h.id]);
  const completed = habits.filter((h) => completions[h.id]);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* ── GREEN HEADER ── */}
      <View style={s.headerBlock}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.title}>HABITS</Text>
          <Text style={s.sub}>
            {habits.length === 0
              ? "No habits yet — tap + to add one"
              : `${completedCount} of ${habits.length} done today`}
          </Text>
        </View>
        <View style={s.scorePill}>
          <Text style={s.scoreNum}>{pct}</Text>
          <Text style={s.scorePct}>%</Text>
        </View>
      </View>

      {/* ── PROGRESS BAR ── */}
      <View style={s.progressRow}>
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              { width: `${pct}%`, backgroundColor: scoreColor },
            ]}
          />
        </View>
        <Text style={[s.progressPct, { color: scoreColor }]}>{pct}%</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GREEN}
          />
        }
      >
        {/* ── EMPTY STATE ── */}
        {habits.length === 0 && (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="leaf-outline" size={28} color={GREEN} />
            </View>
            <Text style={s.emptyTitle}>No habits yet</Text>
            <Text style={s.emptySub}>
              Add daily habits to track your progress.{"\n"}Each completion
              earns XP for your plant.
            </Text>
            <TouchableOpacity
              style={s.emptyBtn}
              onPress={() => setModalOpen(true)}
            >
              <Text style={s.emptyBtnTxt}>ADD YOUR FIRST HABIT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── PENDING ── */}
        {pending.length > 0 && (
          <>
            <Text style={s.sectionLabel}>TO DO TODAY</Text>
            {pending.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                done={false}
                streak={streaks[habit.id] || 0}
                onToggle={toggleHabit}
                onDelete={deleteHabit}
              />
            ))}
          </>
        )}

        {/* ── COMPLETED ── */}
        {completed.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { marginTop: 16 }]}>DONE ✓</Text>
            {completed.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                done={true}
                streak={streaks[habit.id] || 0}
                onToggle={toggleHabit}
                onDelete={deleteHabit}
              />
            ))}
          </>
        )}

        {/* ── SUMMARY CARD ── */}
        {habits.length > 0 && (
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>TODAY'S OVERVIEW</Text>
            <View style={s.summaryRow}>
              <View style={s.summaryItem}>
                <Text style={[s.summaryNum, { color: GREEN }]}>
                  {completedCount}
                </Text>
                <Text style={s.summaryTxt}>Done</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryNum, { color: ORANGE }]}>
                  {pending.length}
                </Text>
                <Text style={s.summaryTxt}>Remaining</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Text style={[s.summaryNum, { color: scoreColor }]}>
                  {pct}%
                </Text>
                <Text style={s.summaryTxt}>Complete</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => setModalOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={WHITE} />
      </TouchableOpacity>

      <AddHabitModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={saveHabit}
      />
    </SafeAreaView>
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
    color: "rgba(255,255,255,0.70)",
    fontWeight: "500",
    marginTop: 2,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(0,0,0,0.20)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreNum: { fontSize: 22, fontWeight: "900", color: WHITE },
  scorePct: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.70)",
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 14,
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressPct: {
    fontSize: 11,
    fontWeight: "800",
    width: 34,
    textAlign: "right",
  },

  sectionLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 3,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
  },

  emptyCard: {
    marginTop: 40,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${GREEN}20`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: WHITE,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyBtnTxt: {
    fontSize: 12,
    fontWeight: "900",
    color: WHITE,
    letterSpacing: 1,
  },

  summaryCard: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  summaryLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2.5,
    fontWeight: "700",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryNum: { fontSize: 28, fontWeight: "900" },
  summaryTxt: { fontSize: 10, color: MUTED, fontWeight: "600" },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.10)",
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
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});

const h = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  cardDone: {
    backgroundColor: "rgba(0,192,96,0.08)",
    borderColor: "rgba(0,192,96,0.20)",
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, fontWeight: "600", color: WHITE },
  nameDone: { color: MUTED, textDecorationLine: "line-through" },
  domainPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  domainTxt: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  streakTxt: { fontSize: 9, color: ORANGE, fontWeight: "700" },
});

const mo = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  sheet: {
    backgroundColor: "#12183A",
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
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 15,
    fontFamily: "Orbitron",
    color: GREEN,
    letterSpacing: 2,
  },
  label: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    fontSize: 15,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  domainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  domainTxt: { fontSize: 12, color: MUTED, fontWeight: "600" },
  freqRow: { flexDirection: "row", gap: 10 },
  freqBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  freqTxt: { fontSize: 13, color: MUTED, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
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
  saveTxt: { fontSize: 13, fontWeight: "900", color: WHITE, letterSpacing: 1 },
});
