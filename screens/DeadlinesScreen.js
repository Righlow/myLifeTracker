// screens/DeadlinesScreen.js — 1Life Hub
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

const RED = COLORS.neonRed;
const GREEN = COLORS.neonGreen;
const MUTED = COLORS.textMuted;
const DEADLINES_KEY = "deadlines_data";

function timeUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const then = new Date(dateStr);
  const diff = then - now;
  if (diff < 0) return "OVERDUE";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${mins}m left`;
}

function urgencyColor(dateStr) {
  if (!dateStr) return MUTED;
  const diff = new Date(dateStr) - new Date();
  if (diff < 0) return RED;
  if (diff < 1000 * 60 * 60 * 24) return RED;
  if (diff < 1000 * 60 * 60 * 24 * 3) return COLORS.neonAmber || "#fbbf24";
  return GREEN;
}

function DateTimePicker({ date, time, onDateChange, onTimeChange }) {
  return (
    <View style={d.dtRow}>
      <View style={d.dtField}>
        <Text style={d.dtLabel}>DATE</Text>
        <TextInput
          style={d.dtInput}
          value={date}
          onChangeText={onDateChange}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#44445a"
          keyboardType="numbers-and-punctuation"
        />
      </View>
      <View style={d.dtField}>
        <Text style={d.dtLabel}>TIME</Text>
        <TextInput
          style={d.dtInput}
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
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const save = async (updated) => {
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
    await save([
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

  const deleteDeadline = (id, title) => {
    Alert.alert("Delete deadline", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const raw = await AsyncStorage.getItem(DEADLINES_KEY);
          const all = raw ? JSON.parse(raw) : [];
          await save(all.filter((dl) => dl.id !== id));
        },
      },
    ]);
  };

  const toggleDone = async (id) => {
    const raw = await AsyncStorage.getItem(DEADLINES_KEY);
    const all = raw ? JSON.parse(raw) : [];
    await save(
      all.map((dl) => (dl.id === id ? { ...dl, done: !dl.done } : dl)),
    );
  };

  const active = deadlines.filter((d) => !d.done);
  const completed = deadlines.filter((d) => d.done);

  return (
    <SafeAreaView style={d.root} edges={["top"]}>
      {/* Header */}
      <View style={d.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={d.backBtn}>
          <Text style={d.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={d.title}>DEADLINES</Text>
        <TouchableOpacity style={d.addBtn} onPress={() => setModal(true)}>
          <Text style={d.addBtnTxt}>+ ADD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {active.length === 0 ? (
          <View style={d.emptyCard}>
            <Text style={d.emptyTitle}>No active deadlines</Text>
            <Text style={d.emptyDesc}>Tap + ADD to track one</Text>
          </View>
        ) : (
          <>
            <Text style={d.secLabel}>ACTIVE</Text>
            {active.map((dl) => {
              const until = timeUntil(dl.datetime);
              const color = urgencyColor(dl.datetime);
              const isOverdue = until === "OVERDUE";
              return (
                <TouchableOpacity
                  key={dl.id}
                  style={d.card}
                  onPress={() => toggleDone(dl.id)}
                  onLongPress={() => deleteDeadline(dl.id, dl.title)}
                  activeOpacity={0.8}
                >
                  <View style={[d.cardAccent, { backgroundColor: color }]} />
                  <View style={d.cardBody}>
                    <View style={d.cardHeader}>
                      <Text style={d.cardTitle}>{dl.title}</Text>
                      <View
                        style={[
                          d.countdownPill,
                          {
                            borderColor: `${color}40`,
                            backgroundColor: `${color}12`,
                          },
                        ]}
                      >
                        <Text style={[d.countdownTxt, { color }]}>{until}</Text>
                      </View>
                    </View>
                    {dl.description ? (
                      <Text style={d.cardDesc}>{dl.description}</Text>
                    ) : null}
                    {dl.datetime ? (
                      <Text style={[d.cardDate, isOverdue && { color: RED }]}>
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
                  </View>
                  <Text style={d.hint}>
                    Tap to complete · Long press to delete
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {completed.length > 0 && (
          <>
            <Text style={d.secLabel}>COMPLETED</Text>
            {completed.map((dl) => (
              <TouchableOpacity
                key={dl.id}
                style={[d.card, { opacity: 0.4 }]}
                onPress={() => toggleDone(dl.id)}
                onLongPress={() => deleteDeadline(dl.id, dl.title)}
                activeOpacity={0.8}
              >
                <View style={d.cardBody}>
                  <Text
                    style={[
                      d.cardTitle,
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

      {/* Add Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={d.overlay}>
          <View style={d.sheet}>
            <View style={d.handle} />
            <Text style={d.modalTitle}>NEW DEADLINE</Text>

            <Text style={d.fieldLabel}>TITLE</Text>
            <TextInput
              style={d.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What's due?"
              placeholderTextColor="#44445a"
              autoFocus
            />

            <Text style={d.fieldLabel}>DESCRIPTION (optional)</Text>
            <TextInput
              style={[d.input, { height: 60 }]}
              value={desc}
              onChangeText={setDesc}
              multiline
              placeholder="Any details..."
              placeholderTextColor="#44445a"
            />

            <Text style={d.fieldLabel}>DUE DATE & TIME</Text>
            <DateTimePicker
              date={date}
              time={time}
              onDateChange={setDate}
              onTimeChange={setTime}
            />

            <View style={d.btns}>
              <TouchableOpacity
                style={d.cancelBtn}
                onPress={() => setModal(false)}
              >
                <Text style={d.cancelTxt}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={d.saveBtn} onPress={create}>
                <Text style={d.saveTxt}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const d = StyleSheet.create({
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
  backArrow: { fontSize: 24, color: RED, fontWeight: "300" },
  title: { fontSize: 14, fontFamily: "Orbitron", color: RED, letterSpacing: 2 },
  addBtn: {
    backgroundColor: RED,
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
  cardAccent: { height: 2 },
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
  cardDesc: { fontSize: 11, color: MUTED, marginBottom: 6 },
  cardDate: { fontSize: 11, color: MUTED },
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
  },
  countdownTxt: { fontSize: 10, fontWeight: "800" },

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
    color: RED,
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
    backgroundColor: RED,
  },
  saveTxt: { color: "#fff", fontWeight: "900", fontSize: 13 },
});
