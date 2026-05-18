// Centralised data layer using AsynchStorage
// Provides simple Create Read Update Delete operations for habits, entries, goals, and health data
//all screens import from her, no screen reads async storage directly
//pattern: readList/writeList are private helpers each storing a list
//each exposes a public API(list,create, update, remove)

import AsyncStorage from "@react-native-async-storage/async-storage";

//Storage keys for each data type
const KEYS = {
  HABITS: "1life_habits",
  ENTRIES: "1life_entries",
  GOALS: "1life_goals",
  HEALTH: "1life_health",
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

async function readList(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeList(key, list) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn("Storage write error:", e);
  }
}

// ── Habits store ──────────────────────────────────────────────
export const habitsStore = {
  list: () => readList(KEYS.HABITS),
  create: async (data) => {
    const list = await readList(KEYS.HABITS);
    const item = { ...data, id: uid(), created_at: new Date().toISOString() };
    await writeList(KEYS.HABITS, [...list, item]);
    return item;
  },
  update: async (id, patch) => {
    const list = await readList(KEYS.HABITS);
    await writeList(
      KEYS.HABITS,
      list.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    );
  },
  remove: async (id) => {
    const list = await readList(KEYS.HABITS);
    await writeList(
      KEYS.HABITS,
      list.filter((h) => h.id !== id),
    );
  },
};

// ── Entries store ─────────────────────────────────────────────
export const entriesStore = {
  list: () => readList(KEYS.ENTRIES),
  create: async (data) => {
    const list = await readList(KEYS.ENTRIES);
    const item = { ...data, id: uid(), created_at: new Date().toISOString() };
    await writeList(KEYS.ENTRIES, [...list, item]);
    return item;
  },
  update: async (id, patch) => {
    const list = await readList(KEYS.ENTRIES);
    await writeList(
      KEYS.ENTRIES,
      list.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  },
  domainXPMap: async () => {
    const entries = await readList(KEYS.ENTRIES);
    const map = {};
    entries.forEach((e) => {
      if (e.domain_xp) {
        Object.entries(e.domain_xp).forEach(([d, xp]) => {
          map[d] = (map[d] || 0) + xp;
        });
      }
    });
    return map;
  },
};

// ── Goals store ───────────────────────────────────────────────
export const goalsStore = {
  list: () => readList(KEYS.GOALS),
  create: async (data) => {
    const list = await readList(KEYS.GOALS);
    const item = { ...data, id: uid(), created_at: new Date().toISOString() };
    await writeList(KEYS.GOALS, [...list, item]);
    return item;
  },
  update: async (id, patch) => {
    const list = await readList(KEYS.GOALS);
    await writeList(
      KEYS.GOALS,
      list.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    );
  },
  remove: async (id) => {
    const list = await readList(KEYS.GOALS);
    await writeList(
      KEYS.GOALS,
      list.filter((g) => g.id !== id),
    );
  },
  getWeeklyScore: async () => {
    const list = await readList(KEYS.GOALS);
    const weekly = list.filter(
      (g) => g.timeframe === "weekly" && (g.status === "active" || !g.status),
    );
    if (!weekly.length) return 0;
    const avg =
      weekly.reduce((s, g) => s + (g.progress || 0), 0) / weekly.length;
    return avg / 100;
  },
};

// ── Health store ──────────────────────────────────────────────
// One entry per day, date-stamped. Data never resets mid-day.
export const healthStore = {
  list: () => readList(KEYS.HEALTH),

  getToday: async () => {
    const list = await readList(KEYS.HEALTH);
    const today = todayStr();
    return list.find((e) => e.date === today) || null;
  },

  saveToday: async (data) => {
    const list = await readList(KEYS.HEALTH);
    const today = todayStr();
    const existing = list.find((e) => e.date === today);
    const entry = {
      ...(existing || { id: uid(), date: today }),
      ...data,
      logged_at: new Date().toISOString(),
    };
    const updated = existing
      ? list.map((e) => (e.date === today ? entry : e))
      : [...list, entry];
    await writeList(KEYS.HEALTH, updated);
    return entry;
  },

  getTodayScore: async () => {
    const list = await readList(KEYS.HEALTH);
    const today = todayStr();
    const entry = list.find((e) => e.date === today);
    if (!entry) return 0;
    const sleepScore = Math.min((entry.sleep || 0) / 8, 1);
    const waterScore = Math.min((entry.water || 0) / 8, 1);
    const movementScore = Math.min((entry.movement || 0) / 60, 1);
    return (sleepScore + waterScore + movementScore) / 3;
  },
};

// ── Routine store ─────────────────────────────────────────────
// Plain persist/load. Done states reset only when user refreshes.
const ROUTINE_KEY = "routine_items";

export const routineStore = {
  get: async () => {
    try {
      const raw = await AsyncStorage.getItem(ROUTINE_KEY);
      if (!raw) return { meetings: [], deadlines: [], tasks: [] };
      return JSON.parse(raw);
    } catch {
      return { meetings: [], deadlines: [], tasks: [] };
    }
  },

  save: async (meetings, deadlines, tasks) => {
    try {
      await AsyncStorage.setItem(
        ROUTINE_KEY,
        JSON.stringify({ meetings, deadlines, tasks }),
      );
    } catch {}
  },

  // Called on pull-to-refresh — resets all done flags
  reset: async () => {
    try {
      const raw = await AsyncStorage.getItem(ROUTINE_KEY);
      if (!raw) return { meetings: [], deadlines: [], tasks: [] };
      const stored = JSON.parse(raw);
      const cleared = {
        meetings: (stored.meetings || []).map((i) => ({ ...i, done: false })),
        deadlines: (stored.deadlines || []).map((i) => ({ ...i, done: false })),
        tasks: (stored.tasks || []).map((i) => ({ ...i, done: false })),
      };
      await AsyncStorage.setItem(ROUTINE_KEY, JSON.stringify(cleared));
      return cleared;
    } catch {
      return { meetings: [], deadlines: [], tasks: [] };
    }
  },

  getScore: async () => {
    const { meetings, deadlines, tasks } = await routineStore.get();
    const all = [...meetings, ...deadlines, ...tasks];
    if (!all.length) return 0;
    return all.filter((i) => i.done).length / all.length;
  },
};

// ── Today quick-tasks store ───────────────────────────────────
// Plain list. Cleared only when user pulls to refresh.
const TODAY_TASKS_KEY = "today_tasks";

export const todayTasksStore = {
  get: async () => {
    try {
      const raw = await AsyncStorage.getItem(TODAY_TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  save: async (items) => {
    try {
      await AsyncStorage.setItem(TODAY_TASKS_KEY, JSON.stringify(items));
    } catch {}
  },

  // Called on pull-to-refresh — wipes the list
  reset: async () => {
    try {
      await AsyncStorage.removeItem(TODAY_TASKS_KEY);
    } catch {}
  },
};
