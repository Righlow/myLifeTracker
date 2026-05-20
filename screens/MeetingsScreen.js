/**
 * screens/MeetingsScreen.js — 1Life Hub | Meetings Screen
 *
 * PURPOSE:
 * A scheduled meeting tracker. Users log upcoming meetings with a title,
 * location, date/time, and optional prep notes. Cards show a live
 * "time until" countdown so users know at a glance what's coming up.
 *
 * KEY FEATURES:
 *  - Upcoming and Completed sections
 *  - Live countdown per meeting (e.g. "In 2h 30m", "Passed")
 *  - Location and notes displayed on card if provided
 *  - Tap to mark done; long press to delete
 *  - Add Modal: title, location, date/time, notes
 *
 * DATA FLOW:
 *  Stored in AsyncStorage under key "meetings_data" as a JSON array.
 *  Sorted by datetime ascending so next meeting is always at the top.
 *
 * DESIGN DECISION:
 * BLUE matches the Routine screen identity since meetings are a sub-category
 * of routine management. Keeping the same colour creates a visual connection
 * between the two screens without needing explicit navigation breadcrumbs.
 */
// screens/MeetingsScreen.js — 1Life Hub | BLUE identity screen
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

const MEETINGS_KEY = "meetings_data";

function timeUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  if (diff < 0) return "Passed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h ${mins}m`;
  return `In ${mins}m`;
}

export default function MeetingsScreen({ navigation }) {
  const [meetings, setMeetings] = useState([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(MEETINGS_KEY);
      const all = raw ? JSON.parse(raw) : [];
      setMeetings(
        all.sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
      );
    } catch {
      setMeetings([]);
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
    await AsyncStorage.setItem(MEETINGS_KEY, JSON.stringify(updated));
    setMeetings(
      updated.sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
    );
  };

  const create = async () => {
    if (!title.trim()) return;
    const [day, month, year] = date.split("/");
    const datetime = `${year}-${month}-${day}T${time || "00:00"}`;
    const raw = await AsyncStorage.getItem(MEETINGS_KEY);
    const all = raw ? JSON.parse(raw) : [];
    await persist([
      ...all,
      {
        id: Date.now().toString(),
        title: title.trim(),
        location: location.trim(),
        datetime,
        notes: notes.trim(),
        done: false,
      },
    ]);
    setTitle("");
    setLocation("");
    setDate("");
    setTime("");
    setNotes("");
    setModal(false);
  };

  const deleteMeeting = (id, name) => {
    Alert.alert("Delete Meeting", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const raw = await AsyncStorage.getItem(MEETINGS_KEY);
          const all = raw ? JSON.parse(raw) : [];
          await persist(all.filter((m) => m.id !== id));
        },
      },
    ]);
  };

  const toggleDone = async (id) => {
    const raw = await AsyncStorage.getItem(MEETINGS_KEY);
    const all = raw ? JSON.parse(raw) : [];
    await persist(all.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  };

  const upcoming = meetings.filter((m) => !m.done);
  const past = meetings.filter((m) => m.done);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* ── BLUE HEADER ── */}
      <View style={s.headerBlock}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.title}>MEETINGS</Text>
          <Text style={s.sub}>
            {upcoming.length} upcoming · long press to delete
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
        {upcoming.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="calendar-outline" size={28} color={BLUE} />
            </View>
            <Text style={s.emptyTitle}>No upcoming meetings</Text>
            <Text style={s.emptySub}>Tap + to schedule one</Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionLabel}>UPCOMING</Text>
            {upcoming.map((m) => {
              const until = timeUntil(m.datetime);
              const isPast = until === "Passed";
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[s.card, isPast && { opacity: 0.55 }]}
                  onPress={() => toggleDone(m.id)}
                  onLongPress={() => deleteMeeting(m.id, m.title)}
                  activeOpacity={0.8}
                >
                  <View style={s.cardAccent} />
                  <View style={s.cardBody}>
                    <View style={s.cardHeader}>
                      <Text style={s.cardTitle}>{m.title}</Text>
                      {until && (
                        <View
                          style={[
                            s.pill,
                            isPast && {
                              borderColor: `${RED}40`,
                              backgroundColor: `${RED}15`,
                            },
                          ]}
                        >
                          <Text style={[s.pillTxt, isPast && { color: RED }]}>
                            {until}
                          </Text>
                        </View>
                      )}
                    </View>
                    {m.location ? (
                      <Text style={s.cardMeta}>
                        <Ionicons
                          name="location-outline"
                          size={11}
                          color={MUTED}
                        />{" "}
                        {m.location}
                      </Text>
                    ) : null}
                    {m.datetime ? (
                      <Text style={s.cardMeta}>
                        {new Date(m.datetime).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                        {"  "}
                        {new Date(m.datetime).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    ) : null}
                    {m.notes ? (
                      <Text style={s.cardNotes}>{m.notes}</Text>
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

        {past.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { marginTop: 16 }]}>COMPLETED ✓</Text>
            {past.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[s.card, { opacity: 0.4 }]}
                onPress={() => toggleDone(m.id)}
                onLongPress={() => deleteMeeting(m.id, m.title)}
              >
                <View style={s.cardBody}>
                  <Text
                    style={[
                      s.cardTitle,
                      { textDecorationLine: "line-through" },
                    ]}
                  >
                    {m.title}
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
              <Ionicons name="calendar-outline" size={20} color={BLUE} />
              <Text style={m.title}>NEW MEETING</Text>
            </View>

            <Text style={m.label}>TITLE</Text>
            <TextInput
              style={m.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What's the meeting about?"
              placeholderTextColor={MUTED}
              color={WHITE}
              autoFocus
            />

            <Text style={m.label}>LOCATION (optional)</Text>
            <TextInput
              style={m.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Room, Zoom link..."
              placeholderTextColor={MUTED}
              color={WHITE}
            />

            <Text style={m.label}>DATE & TIME</Text>
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
                  placeholder="09:00"
                  placeholderTextColor={MUTED}
                  color={WHITE}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <Text style={m.label}>NOTES (optional)</Text>
            <TextInput
              style={[m.input, { height: 60 }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Any prep notes..."
              placeholderTextColor={MUTED}
              color={WHITE}
            />

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
    backgroundColor: BLUE,
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
  cardAccent: { height: 3, backgroundColor: BLUE },
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
  cardMeta: { fontSize: 11, color: MUTED, marginBottom: 4 },
  cardNotes: { fontSize: 11, color: MUTED, marginTop: 6, fontStyle: "italic" },
  hint: { fontSize: 9, color: "rgba(255,255,255,0.20)", marginTop: 8 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${BLUE}40`,
    backgroundColor: `${BLUE}15`,
  },
  pillTxt: { fontSize: 10, fontWeight: "700", color: BLUE },
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
    backgroundColor: `${BLUE}20`,
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
    color: BLUE,
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
    backgroundColor: BLUE,
    flexDirection: "row",
    gap: 8,
  },
  saveTxt: { fontSize: 13, fontWeight: "900", color: WHITE, letterSpacing: 1 },
});
