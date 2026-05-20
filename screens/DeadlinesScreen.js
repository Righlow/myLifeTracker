/**
 * screens/DeadlinesScreen.js — 1Life Hub | Deadlines Screen
 *
 * PURPOSE:
 * A focused deadline tracker. Users can add time-bound items with a title,
 * optional description, and a due date/time. Cards display a live countdown
 * and colour-code by urgency: green (>3 days), orange (1–3 days), red (<24h or overdue).
 *
 * KEY FEATURES:
 *  - Countdown timer per deadline (e.g. "2d 4h left", "OVERDUE")
 *  - Urgency colour coding on card accent bar and countdown pill
 *  - Tap card to mark complete; long press to delete
 *  - Completed items shown below active ones at reduced opacity
 *  - Add Modal: title, description, date (DD/MM/YYYY), time (HH:MM)
 *
 * DATA FLOW:
 *  Stored in AsyncStorage under key "deadlines_data" as a JSON array.
 *  Sorted by datetime on every load/save so nearest deadline is always first.
 *
 * DESIGN DECISION:
 * ORANGE was chosen to convey urgency and time-sensitivity. This screen is
 * intentionally standalone (not part of Routine) so users can navigate
 * directly to it from the Routine FAB overlay for focused deadline management.
 */
// screens/DeadlinesScreen.js — 1Life Hub | ORANGE identity screen
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BG = "#0A0E27";
const RED = "#CC0000";
const BLUE = "#0047AB";
const GREEN = "#00C060";
const ORANGE = "#FF4B0A";
const WHITE = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.55)";
const DIM = "rgba(255,255,255,0.80)";

const DEADLINES_KEY = "deadlines_data";

function timeUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  if (diff < 0) return "OVERDUE";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function urgencyColor(dateStr) {
  if (!dateStr) return MUTED;
  const diff = new Date(dateStr) - new Date();
  if (diff < 0) return RED;
  if (diff < 86400000) return RED;
  if (diff < 86400000 * 3) return ORANGE;
  return GREEN;
}

export default function DeadlinesScreen({ navigation }) {
  const [deadlines, setDeadlines] = useState([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(DEADLINES_KEY);
      const all = raw ? JSON.parse(raw) : [];
      setDeadlines(
        all.sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
      );
    } catch {
      setDeadlines([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const u = navigation.addListener("focus", load);
    return u;
  }, [navigation, load]);

  const persist = async (updated) => {
    await AsyncStorage.setItem(DEADLINES_KEY, JSON.stringify(updated));
    setDeadlines(
      updated.sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
    );
  };

  const create = async () => {
    if (!title.trim()) return;
    const [day, month, year] = date.split("/");
    const datetime = `${year}-${month}-${day}T${time || "23:59"}`;
    const raw = await AsyncStorage.getItem(DEADLINES_KEY);
    const all = raw ? JSON.parse(raw) : [];
    await persist([
      ...all,
      {
        id: Date.now().toString(),
        title: title.trim(),
        description: desc.trim(),
        datetime,
        done: false,
      },
    ]);
    setTitle("");
    setDesc("");
    setDate("");
    setTime("");
    setModal(false);
  };

  const deleteDeadline = (id, name) => {
    Alert.alert("Delete Deadline", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const raw = await AsyncStorage.getItem(DEADLINES_KEY);
          const all = raw ? JSON.parse(raw) : [];
          await persist(all.filter((dl) => dl.id !== id));
        },
      },
    ]);
  };

  const toggleDone = async (id) => {
    const raw = await AsyncStorage.getItem(DEADLINES_KEY);
    const all = raw ? JSON.parse(raw) : [];
    await persist(
      all.map((dl) => (dl.id === id ? { ...dl, done: !dl.done } : dl)),
    );
  };

  const active = deadlines.filter((d) => !d.done);
  const completed = deadlines.filter((d) => d.done);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* ── ORANGE HEADER ── */}
      <View style={s.headerBlock}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.title}>DEADLINES</Text>
          <Text style={s.sub}>
            {active.length} active · tap card to complete
          </Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {active.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="alarm-outline" size={28} color={ORANGE} />
            </View>
            <Text style={s.emptyTitle}>No active deadlines</Text>
            <Text style={s.emptySub}>Tap + to add one</Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionLabel}>ACTIVE</Text>
            {active.map((dl) => {
              const until = timeUntil(dl.datetime);
              const col = urgencyColor(dl.datetime);
              return (
                <TouchableOpacity
                  key={dl.id}
                  style={s.card}
                  onPress={() => toggleDone(dl.id)}
                  onLongPress={() => deleteDeadline(dl.id, dl.title)}
                  activeOpacity={0.8}
                >
                  <View style={[s.cardAccent, { backgroundColor: col }]} />
                  <View style={s.cardBody}>
                    <View style={s.cardHeader}>
                      <Text style={s.cardTitle}>{dl.title}</Text>
                      {until && (
                        <View
                          style={[
                            s.pill,
                            {
                              borderColor: `${col}50`,
                              backgroundColor: `${col}15`,
                            },
                          ]}
                        >
                          <Text style={[s.pillTxt, { color: col }]}>
                            {until}
                          </Text>
                        </View>
                      )}
                    </View>
                    {dl.description ? (
                      <Text style={s.cardDesc}>{dl.description}</Text>
                    ) : null}
                    {dl.datetime ? (
                      <Text style={s.cardDate}>
                        Due:{" "}
                        {new Date(dl.datetime).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                        {"  "}
                        {new Date(dl.datetime).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    ) : null}
                    <Text style={s.hint}>
                      Tap to complete · Long press to delete
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {completed.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { marginTop: 16 }]}>COMPLETED ✓</Text>
            {completed.map((dl) => (
              <TouchableOpacity
                key={dl.id}
                style={[s.card, { opacity: 0.4 }]}
                onPress={() => toggleDone(dl.id)}
                onLongPress={() => deleteDeadline(dl.id, dl.title)}
              >
                <View style={s.cardBody}>
                  <Text
                    style={[
                      s.cardTitle,
                      { textDecorationLine: "line-through" },
                    ]}
                  >
                    {dl.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* ── ADD MODAL ── */}
      <Modal
        visible={modal}
        animationType="slide"
        transparent
        onRequestClose={() => setModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={m.overlay}
        >
          <TouchableOpacity
            style={m.backdrop}
            activeOpacity={1}
            onPress={() => setModal(false)}
          />
          <View style={m.sheet}>
            <View style={m.handle} />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <Ionicons name="alarm-outline" size={20} color={ORANGE} />
              <Text style={m.title}>NEW DEADLINE</Text>
            </View>

            <Text style={m.label}>TITLE</Text>
            <TextInput
              style={m.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What's due?"
              placeholderTextColor={MUTED}
              color={WHITE}
              autoFocus
            />

            <Text style={m.label}>DESCRIPTION (optional)</Text>
            <TextInput
              style={[m.input, { height: 60 }]}
              value={desc}
              onChangeText={setDesc}
              multiline
              placeholder="Any details..."
              placeholderTextColor={MUTED}
              color={WHITE}
            />

            <Text style={m.label}>DUE DATE & TIME</Text>
            <View style={m.dtRow}>
              <View style={{ flex: 1 }}>
                <Text style={m.dtLabel}>DATE (DD/MM/YYYY)</Text>
                <TextInput
                  style={m.dtInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="20/05/2026"
                  placeholderTextColor={MUTED}
                  color={WHITE}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={m.dtLabel}>TIME (HH:MM)</Text>
                <TextInput
                  style={m.dtInput}
                  value={time}
                  onChangeText={setTime}
                  placeholder="23:59"
                  placeholderTextColor={MUTED}
                  color={WHITE}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <View style={m.actions}>
              <TouchableOpacity
                style={m.cancelBtn}
                onPress={() => setModal(false)}
              >
                <Text style={m.cancelTxt}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.saveBtn, !title.trim() && { opacity: 0.4 }]}
                onPress={create}
                disabled={!title.trim()}
              >
                <Ionicons name="checkmark" size={16} color={WHITE} />
                <Text style={m.saveTxt}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  headerBlock: {
    backgroundColor: ORANGE,
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 3,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
    overflow: "hidden",
  },
  cardAccent: { height: 3 },
  cardBody: { padding: 16 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: WHITE,
    flex: 1,
    marginRight: 8,
  },
  cardDesc: { fontSize: 12, color: MUTED, marginBottom: 6 },
  cardDate: { fontSize: 11, color: MUTED },
  hint: { fontSize: 9, color: "rgba(255,255,255,0.20)", marginTop: 8 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillTxt: { fontSize: 10, fontWeight: "800" },
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
    backgroundColor: `${ORANGE}20`,
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
  emptySub: { fontSize: 13, color: MUTED },
});

const m = StyleSheet.create({
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
    color: ORANGE,
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
  dtRow: { flexDirection: "row", gap: 10 },
  dtLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: 6,
  },
  dtInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    fontSize: 14,
    textAlign: "center",
  },
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
    backgroundColor: ORANGE,
    flexDirection: "row",
    gap: 8,
  },
  saveTxt: { fontSize: 13, fontWeight: "900", color: WHITE, letterSpacing: 1 },
});
