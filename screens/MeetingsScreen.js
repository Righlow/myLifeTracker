// screens/MeetingsScreen.js — 1Life Hub
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../constants/colors";

const GREEN = COLORS.neonGreen;
const MUTED = COLORS.textMuted;
const MEETINGS_KEY = "meetings_data";

function formatDate(dateStr) {
  if (!dateStr) return null;
  return dateStr;
}

function timeUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const then = new Date(dateStr);
  const diff = then - now;
  if (diff < 0) return "Passed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h ${mins}m`;
  return `In ${mins}m`;
}

// Simple date/time picker using text inputs
function DateTimePicker({ date, time, onDateChange, onTimeChange }) {
  return (
    <View style={p.dtRow}>
      <View style={p.dtField}>
        <Text style={p.dtLabel}>DATE</Text>
        <TextInput
          style={p.dtInput}
          value={date}
          onChangeText={onDateChange}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#44445a"
          keyboardType="numbers-and-punctuation"
        />
      </View>
      <View style={p.dtField}>
        <Text style={p.dtLabel}>TIME</Text>
        <TextInput
          style={p.dtInput}
          value={time}
          onChangeText={onTimeChange}
          placeholder="HH:MM"
          placeholderTextColor="#44445a"
          keyboardType="numbers-and-punctuation"
        />
      </View>
    </View>
  );
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
      // Sort by date
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
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const save = async (updated) => {
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
    const newMeeting = {
      id: Date.now().toString(),
      title: title.trim(),
      location: location.trim(),
      datetime,
      notes: notes.trim(),
      done: false,
    };
    await save([...all, newMeeting]);
    setTitle("");
    setLocation("");
    setDate("");
    setTime("");
    setNotes("");
    setModal(false);
  };

  const deleteMeeting = (id, title) => {
    Alert.alert("Delete meeting", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const raw = await AsyncStorage.getItem(MEETINGS_KEY);
          const all = raw ? JSON.parse(raw) : [];
          await save(all.filter((m) => m.id !== id));
        },
      },
    ]);
  };

  const toggleDone = async (id) => {
    const raw = await AsyncStorage.getItem(MEETINGS_KEY);
    const all = raw ? JSON.parse(raw) : [];
    await save(all.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  };

  const upcoming = meetings.filter((m) => !m.done);
  const past = meetings.filter((m) => m.done);

  return (
    <SafeAreaView style={p.root} edges={["top"]}>
      {/* Header */}
      <View style={p.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={p.backBtn}>
          <Text style={p.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={p.title}>MEETINGS</Text>
        <TouchableOpacity style={p.addBtn} onPress={() => setModal(true)}>
          <Text style={p.addBtnTxt}>+ ADD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming */}
        {upcoming.length === 0 ? (
          <View style={p.emptyCard}>
            <Text style={p.emptyTitle}>No upcoming meetings</Text>
            <Text style={p.emptyDesc}>Tap + ADD to schedule one</Text>
          </View>
        ) : (
          <>
            <Text style={p.secLabel}>UPCOMING</Text>
            {upcoming.map((m) => {
              const until = timeUntil(m.datetime);
              const isPast = until === "Passed";
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[p.card, isPast && { opacity: 0.5 }]}
                  onLongPress={() => deleteMeeting(m.id, m.title)}
                  onPress={() => toggleDone(m.id)}
                  activeOpacity={0.8}
                >
                  <View style={p.cardAccent} />
                  <View style={p.cardBody}>
                    <View style={p.cardHeader}>
                      <Text style={p.cardTitle}>{m.title}</Text>
                      {until && (
                        <View
                          style={[
                            p.countdownPill,
                            isPast && {
                              borderColor: "rgba(255,80,80,0.3)",
                              backgroundColor: "rgba(255,80,80,0.1)",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              p.countdownTxt,
                              isPast && { color: "#f87171" },
                            ]}
                          >
                            {until}
                          </Text>
                        </View>
                      )}
                    </View>
                    {m.location ? (
                      <Text style={p.cardMeta}>📍 {m.location}</Text>
                    ) : null}
                    {m.datetime ? (
                      <Text style={p.cardMeta}>
                        🗓{" "}
                        {new Date(m.datetime).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                        {"  "}
                        🕐{" "}
                        {new Date(m.datetime).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    ) : null}
                    {m.notes ? (
                      <Text style={p.cardNotes}>{m.notes}</Text>
                    ) : null}
                  </View>
                  <Text style={p.hint}>Long press to delete</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Past / Done */}
        {past.length > 0 && (
          <>
            <Text style={p.secLabel}>COMPLETED</Text>
            {past.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[p.card, { opacity: 0.4 }]}
                onPress={() => toggleDone(m.id)}
                onLongPress={() => deleteMeeting(m.id, m.title)}
                activeOpacity={0.8}
              >
                <View style={p.cardBody}>
                  <Text
                    style={[
                      p.cardTitle,
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

      {/* Add Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={p.overlay}>
          <View style={p.sheet}>
            <View style={p.handle} />
            <Text style={p.modalTitle}>NEW MEETING</Text>

            <Text style={p.fieldLabel}>TITLE</Text>
            <TextInput
              style={p.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What's the meeting about?"
              placeholderTextColor="#44445a"
              autoFocus
            />

            <Text style={p.fieldLabel}>LOCATION (optional)</Text>
            <TextInput
              style={p.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Room, Zoom link, address..."
              placeholderTextColor="#44445a"
            />

            <Text style={p.fieldLabel}>DATE & TIME</Text>
            <DateTimePicker
              date={date}
              time={time}
              onDateChange={setDate}
              onTimeChange={setTime}
            />

            <Text style={p.fieldLabel}>NOTES (optional)</Text>
            <TextInput
              style={[p.input, { height: 60 }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Any prep notes..."
              placeholderTextColor="#44445a"
            />

            <View style={p.btns}>
              <TouchableOpacity
                style={p.cancelBtn}
                onPress={() => setModal(false)}
              >
                <Text style={p.cancelTxt}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={p.saveBtn} onPress={create}>
                <Text style={p.saveTxt}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const p = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 24, color: GREEN, fontWeight: "300" },
  title: {
    fontSize: 14,
    fontFamily: "Orbitron",
    color: GREEN,
    letterSpacing: 2,
  },
  addBtn: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnTxt: { color: "#000", fontWeight: "900", fontSize: 12 },

  secLabel: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
  },

  card: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  cardAccent: { height: 2, backgroundColor: GREEN },
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
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  cardMeta: { fontSize: 11, color: MUTED, marginBottom: 4 },
  cardNotes: { fontSize: 11, color: MUTED, marginTop: 6, fontStyle: "italic" },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    fontSize: 9,
    color: "rgba(0,0,0,0.10)",
  },

  countdownPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${GREEN}40`,
    backgroundColor: `${GREEN}12`,
  },
  countdownTxt: { fontSize: 10, fontWeight: "700", color: GREEN },

  emptyCard: {
    margin: 14,
    padding: 32,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyDesc: { fontSize: 12, color: MUTED },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.75)",
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
    backgroundColor: "rgba(0,0,0,0.10)",
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
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    color: "#e8e8f0",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 14,
  },
  dtRow: { flexDirection: "row", gap: 10 },
  dtField: { flex: 1 },
  dtLabel: {
    fontSize: 9,
    color: "#44445a",
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: 4,
  },
  dtInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    color: "#e8e8f0",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 14,
    textAlign: "center",
  },
  btns: { flexDirection: "row", gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
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
