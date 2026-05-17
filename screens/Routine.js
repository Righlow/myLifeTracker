// screens/Routine.js  —  1Life Hub
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

const GREEN = COLORS.neonGreen;
const RED = COLORS.neonRed;
const AMBER = COLORS.neonAmber || "#fbbf24";
const BLUE = COLORS.neonBlue || "#60a5fa";
const MUTED = COLORS.textMuted;

const TABS = [
  { key: "meeting", label: "Meeting", icon: "calendar-outline", color: BLUE },
  { key: "deadline", label: "Deadline", icon: "timer-outline", color: AMBER },
  { key: "task", label: "Task", icon: "checkmark-outline", color: GREEN },
];

const PRIORITIES = [
  { key: "low", label: "LOW", color: MUTED },
  { key: "med", label: "MED", color: AMBER },
  { key: "high", label: "HIGH", color: RED },
];

// ── UNIFIED ADD MODAL ─────────────────────────────────────────
function AddModal({ visible, defaultType, onSave, onClose }) {
  const [type, setType] = useState(defaultType || "task");
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [priority, setPriority] = useState("med");

  React.useEffect(() => {
    if (visible && defaultType) setType(defaultType);
  }, [defaultType, visible]);

  const reset = () => {
    setTitle("");
    setWhen("");
    setPriority("med");
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), date: when, time: "", type, priority });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const cfg = TABS.find((t) => t.key === type);
  const color = cfg?.color || GREEN;

  const placeholder =
    type === "meeting"
      ? "What is the meeting about?"
      : type === "deadline"
        ? "What is due?"
        : "What needs to be done?";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={m.overlay}
      >
        <TouchableOpacity
          style={m.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={m.sheet}>
          <View style={m.handle} />

          {/* X close */}
          <TouchableOpacity style={m.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={16} color={MUTED} />
          </TouchableOpacity>

          {/* Title with icon */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <Ionicons
              name={cfg?.icon || "checkmark-outline"}
              size={20}
              color={color}
            />
            <Text style={[m.sheetTitle, { color }]}>
              NEW {type.toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text style={m.fieldLabel}>TITLE</Text>
          <TextInput
            style={m.input}
            placeholder={placeholder}
            placeholderTextColor="#44445a"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          {/* Date/time — meetings and deadlines only */}
          {type !== "task" && (
            <>
              <Text style={m.fieldLabel}>
                {type === "meeting" ? "WHEN" : "DUE DATE"}
              </Text>
              <TextInput
                style={m.input}
                placeholder="yyyy/mm/dd, --:--"
                placeholderTextColor="#44445a"
                value={when}
                onChangeText={setWhen}
              />
            </>
          )}

          {/* Location — meetings only */}
          {type === "meeting" && (
            <>
              <Text style={m.fieldLabel}>LOCATION (OPTIONAL)</Text>
              <TextInput
                style={m.input}
                placeholder="Room, Zoom link, address..."
                placeholderTextColor="#44445a"
              />
            </>
          )}

          {/* Priority — tasks only */}
          {type === "task" && (
            <>
              <Text style={m.fieldLabel}>PRIORITY</Text>
              <View style={m.priorityRow}>
                {PRIORITIES.map((pr) => (
                  <TouchableOpacity
                    key={pr.key}
                    style={[
                      m.priorityBtn,
                      priority === pr.key && {
                        backgroundColor: `${pr.color}22`,
                        borderColor: pr.color,
                      },
                    ]}
                    onPress={() => setPriority(pr.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        m.priorityTxt,
                        priority === pr.key && {
                          color: pr.color,
                          fontWeight: "800",
                        },
                      ]}
                    >
                      {pr.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Actions */}
          <View style={m.actions}>
            <TouchableOpacity
              style={m.cancelBtn}
              onPress={handleClose}
              activeOpacity={0.75}
            >
              <Text style={m.cancelTxt}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                m.saveBtn,
                { backgroundColor: color },
                !title.trim() && { opacity: 0.4 },
              ]}
              onPress={handleSave}
              disabled={!title.trim()}
              activeOpacity={0.85}
            >
              <Text style={m.saveTxt}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── ITEM CARD ─────────────────────────────────────────────────
function ItemCard({ item, type, onToggle, onDelete }) {
  const tab = TABS.find((t) => t.key === type);
  const col = tab?.color || GREEN;
  return (
    <View
      style={[r.itemCard, { borderLeftColor: item.done ? `${col}30` : col }]}
    >
      <TouchableOpacity
        style={[
          r.check,
          item.done && { backgroundColor: col, borderColor: col },
        ]}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
      >
        {item.done && <Ionicons name="checkmark" size={13} color="#000" />}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[r.itemTitle, item.done && r.itemDone]}>{item.title}</Text>
        {item.date ? <Text style={r.itemMeta}>{item.date}</Text> : null}
        {item.priority && item.priority !== "med" && (
          <Text
            style={[
              r.itemPriority,
              { color: item.priority === "high" ? RED : MUTED },
            ]}
          >
            {item.priority.toUpperCase()} PRIORITY
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-outline" size={18} color={MUTED} />
      </TouchableOpacity>
    </View>
  );
}

// ── EMPTY STATE — dashed border card ─────────────────────────
function EmptyState({ type }) {
  const tab = TABS.find((t) => t.key === type);
  const col = tab?.color || GREEN;
  return (
    <View style={r.emptyCard}>
      <View style={[r.emptyIconWrap, { backgroundColor: `${col}18` }]}>
        <Ionicons
          name={tab?.icon || "checkmark-circle-outline"}
          size={26}
          color={col}
        />
      </View>
      <Text style={r.emptyTxt}>No {tab?.label.toLowerCase()}s yet</Text>
      <Text style={r.emptySub}>Tap the + to add one</Text>
    </View>
  );
}

// ── TASK TAB ──────────────────────────────────────────────────
function TaskTab({ items, onToggle, onDelete }) {
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  return (
    <View style={r.tabContent}>
      {/* Progress card */}
      <View style={r.progressCard}>
        <View style={r.progressRow}>
          <View>
            <Text style={r.progressTitle}>Tasks completed</Text>
            <Text style={r.progressSub}>
              {items.length === 0 ? "Nothing logged today" : `${pct}% done`}
            </Text>
          </View>
          <View
            style={[
              r.countPill,
              {
                borderColor:
                  pct === 100 ? `${GREEN}50` : "rgba(255,255,255,0.15)",
              },
            ]}
          >
            <Text
              style={[r.countTxt, { color: pct === 100 ? GREEN : COLORS.text }]}
            >
              {done} / {items.length}
            </Text>
          </View>
        </View>
        <View style={r.progressTrack}>
          <View
            style={[
              r.progressFill,
              {
                width: `${pct}%`,
                backgroundColor: pct === 100 ? GREEN : `${GREEN}80`,
              },
            ]}
          />
        </View>
      </View>

      {/* Empty or list */}
      {items.length === 0 ? (
        <EmptyState type="task" />
      ) : (
        items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            type="task"
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))
      )}
    </View>
  );
}

// ── OVERVIEW STRIP — matches Lovable's TODAY'S OVERVIEW ───────
function OverviewStrip({ meetings, deadlines, tasks }) {
  const rows = [
    { tab: TABS[0], items: meetings },
    { tab: TABS[1], items: deadlines },
    { tab: TABS[2], items: tasks },
  ];
  const total = rows.reduce((s, r) => s + r.items.length, 0);
  const done = rows.reduce(
    (s, r) => s + r.items.filter((i) => i.done).length,
    0,
  );
  const pct = total ? Math.round((done / total) * 100) : 0;
  const col = pct >= 70 ? GREEN : pct >= 40 ? AMBER : RED;

  return (
    <View style={r.overviewCard}>
      <Text style={r.secLabel}>TODAY'S OVERVIEW</Text>
      <View style={r.overviewHeader}>
        <Text style={r.overviewTitle}>Overall completion</Text>
        <Text style={[r.overviewPct, { color: col }]}>{pct}%</Text>
      </View>
      {rows.map(({ tab, items }) => {
        const d = items.filter((i) => i.done).length;
        const p = items.length ? Math.round((d / items.length) * 100) : 0;
        return (
          <View key={tab.key} style={r.overviewRow}>
            <Ionicons name={tab.icon} size={14} color={tab.color} />
            <View style={r.overviewTrack}>
              <View
                style={[
                  r.overviewFill,
                  { width: `${p}%`, backgroundColor: tab.color },
                ]}
              />
            </View>
            <Text style={[r.overviewCount, { color: tab.color }]}>
              {d}/{items.length}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function RoutineScreen({ navigation, route }) {
  const defaultTab = route?.params?.defaultTab;
  const [activeTab, setActiveTab] = useState(defaultTab || "task");
  const [meetings, setMeetings] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("task");

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
      // Auto-open the add modal with the correct type when coming from Today's FAB
      setModalType(defaultTab);
      setModalVisible(true);
    }
  }, [defaultTab]);

  const listFor = (type) =>
    type === "meeting" ? meetings : type === "deadline" ? deadlines : tasks;
  const setListFor = (type) =>
    type === "meeting"
      ? setMeetings
      : type === "deadline"
        ? setDeadlines
        : setTasks;

  const openModal = (type) => {
    setModalType(type);
    setActiveTab(type);
    setModalVisible(true);
  };
  const handleSave = (item) => {
    setListFor(item.type)((prev) => [
      { ...item, id: Date.now().toString(), done: false },
      ...prev,
    ]);
    setModalVisible(false);
  };
  const handleToggle = (type, id) =>
    setListFor(type)((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    );
  const handleDelete = (type, id) =>
    setListFor(type)((prev) => prev.filter((i) => i.id !== id));

  const total = meetings.length + deadlines.length + tasks.length;
  const done =
    meetings.filter((i) => i.done).length +
    deadlines.filter((i) => i.done).length +
    tasks.filter((i) => i.done).length;
  const overallScore = total ? Math.round((done / total) * 100) : 0;
  const scoreColor =
    overallScore >= 70 ? GREEN : overallScore >= 40 ? AMBER : RED;

  return (
    <SafeAreaView style={r.root} edges={["top"]}>
      {/* Header */}
      <View style={r.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={r.backBtn}>
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={r.title}>ROUTINE</Text>
          <Text style={r.sub}>
            {total ? `${done} of ${total} items done` : "Nothing planned yet"}
          </Text>
        </View>
        <View
          style={[
            r.scorePill,
            {
              borderColor: `${scoreColor}40`,
              backgroundColor: `${scoreColor}12`,
            },
          ]}
        >
          <Text style={[r.scoreNum, { color: scoreColor }]}>
            {overallScore}
          </Text>
          <Text style={[r.scorePct, { color: scoreColor }]}>%</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={r.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          const count = listFor(tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[r.tabBtn, active && { backgroundColor: tab.color }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={active ? "#000" : MUTED}
              />
              <Text style={[r.tabLabel, active && r.tabLabelActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    r.badge,
                    active && { backgroundColor: "rgba(0,0,0,0.2)" },
                  ]}
                >
                  <Text style={[r.badgeTxt, active && { color: "#000" }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "meeting" && (
          <View style={r.tabContent}>
            {meetings.length === 0 ? (
              <EmptyState type="meeting" />
            ) : (
              meetings.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  type="meeting"
                  onToggle={(id) => handleToggle("meeting", id)}
                  onDelete={(id) => handleDelete("meeting", id)}
                />
              ))
            )}
          </View>
        )}
        {activeTab === "deadline" && (
          <View style={r.tabContent}>
            {deadlines.length === 0 ? (
              <EmptyState type="deadline" />
            ) : (
              deadlines.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  type="deadline"
                  onToggle={(id) => handleToggle("deadline", id)}
                  onDelete={(id) => handleDelete("deadline", id)}
                />
              ))
            )}
          </View>
        )}
        {activeTab === "task" && (
          <TaskTab
            items={tasks}
            onToggle={(id) => handleToggle("task", id)}
            onDelete={(id) => handleDelete("task", id)}
          />
        )}
        <OverviewStrip
          meetings={meetings}
          deadlines={deadlines}
          tasks={tasks}
        />
      </ScrollView>

      {/* Simple + FAB — matches Lovable screenshot */}
      <TouchableOpacity
        style={r.fab}
        onPress={() => openModal(activeTab)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>

      <AddModal
        visible={modalVisible}
        defaultType={modalType}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const r = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 16,
    fontFamily: "Orbitron",
    color: GREEN,
    letterSpacing: 1.5,
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
  scoreNum: { fontSize: 22, fontWeight: "900" },
  scorePct: { fontSize: 12, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
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
    gap: 5,
  },
  tabLabel: { fontSize: 11, fontWeight: "700", color: MUTED },
  tabLabelActive: { color: "#000" },
  badge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
  },
  badgeTxt: { fontSize: 9, fontWeight: "800", color: MUTED },

  tabContent: { paddingHorizontal: 16, paddingTop: 4 },

  // Task progress card
  progressCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  progressSub: { fontSize: 11, color: MUTED, marginTop: 3 },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  countTxt: { fontSize: 14, fontWeight: "900" },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },

  // Empty state — dashed border
  emptyCard: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    borderStyle: "dashed",
    borderRadius: 18,
    padding: 40,
    alignItems: "center",
    marginBottom: 14,
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySub: { fontSize: 12, color: MUTED },

  // Item cards
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderLeftWidth: 3,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemDone: { color: MUTED, textDecorationLine: "line-through", opacity: 0.5 },
  itemMeta: { fontSize: 10, color: MUTED },
  itemPriority: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 3,
  },

  // Overview strip
  overviewCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  secLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 12,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  overviewTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  overviewPct: { fontSize: 18, fontWeight: "900" },
  overviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  overviewTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 3,
    overflow: "hidden",
  },
  overviewFill: { height: "100%", borderRadius: 3 },
  overviewCount: {
    fontSize: 11,
    fontWeight: "700",
    width: 30,
    textAlign: "right",
  },

  // Simple FAB
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

// ── MODAL STYLES ──────────────────────────────────────────────
const m = StyleSheet.create({
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
    marginBottom: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 14,
    fontFamily: "Orbitron",
    color: GREEN,
    letterSpacing: 2,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 14,
  },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },
  priorityTxt: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
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
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: GREEN,
  },
  saveTxt: { fontSize: 12, fontWeight: "900", color: "#000", letterSpacing: 1 },
});
