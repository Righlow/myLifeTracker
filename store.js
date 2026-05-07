
// Centralised data layer using AsynchStorage
// Provides simple Create Read Update Delete operations for habits, entries, goals, and health data
//all screens import from her, no screen reads async storage directly
//pattern: readList/writeList are private helpers each storing a list 
//each exposes a public API(list,create, update, remove)

import AsyncStorage from '@react-native-async-storage/async-storage';

//Storage keys for each data type 
//centralising keys are constant prevents types across app
//prefixed with 'life' file to colliosion with other apps
//sharing the same asyncstorage namespace on the device
const KEYS = {
  HABITS:  '1life_habits',
  ENTRIES: '1life_entries',
  GOALS:   '1life_goals',
  HEALTH:  '1life_health',
};
//CREATE
//creates unique id by for each new record using
// - Date.now().toString(36): current timestamp in base-36 (shorter string)
// - Math.random().toString(36).slice(2,7): 5 random base-36 characters
// Combined they produce a unique enough ID without a library
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
//READ & WRITE
//readList(Key) reads Json array from async storage by key,
//asyncstorage only stores strings, json.parse converts it back 
//to a js array, retrns empty if nothings stored yet
async function readList(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
  //if parsing fails(corrupted data), return empty array
  //rather than crashing 
}
//WRITE
//private helper, writes a js array to aync storage as JSON
//Json.stringify converts the arra to a string for storage
async function writeList(key, list) {
  try { await AsyncStorage.setItem(key, JSON.stringify(list)); }
  catch (e) { console.warn('Storage write error:', e); }
}

// Habits store
//manages the user's habit list, each habit has
//{id, name,domain, XP_value, is_Active, created_at}
export const habitsStore = {
  //list() reads the habit list from storage and returns it as a js array
  list: () => readList(KEYS.HABITS),
  //create(data) adds a new habit with auto-generated id and time stamp
  //spread operater accross data,id,created_at merges passed data with
  //system generated fields, and new item gets appended to the existing file 
  create: async (data) => {
    const list = await readList(KEYS.HABITS);
    const item = { ...data, id: uid(), created_at: new Date().toISOString() };
    await writeList(KEYS.HABITS, [...list, item]);
    return item;
  },
  //partially updates habit by id,
  //list.map() returns new  array where only the matching item is changed
  //patch is an object with the fields to update, merged with existing habit data
  update: async (id, patch) => {
    const list = await readList(KEYS.HABITS);
    await writeList(KEYS.HABITS, list.map(h => h.id === id ? { ...h, ...patch } : h));
  },
  //deletes habit by filtering it out of the array
  //list.filter returns a new array without the matching item
  remove: async (id) => {
    const list = await readList(KEYS.HABITS);
    await writeList(KEYS.HABITS, list.filter(h => h.id !== id));
  },
};

// Entries
//Daily log entries linking habit completion to XP earned
//Each entry shapes: { id, habit_id, domain_xp: { [domain]: xp }, created_at } 
export const entriesStore = {
  list: () => readList(KEYS.ENTRIES),
  create: async (data) => {
    const list = await readList(KEYS.ENTRIES);
    const item = { ...data, id: uid(), created_at: new Date().toISOString() };
    await writeList(KEYS.ENTRIES, [...list, item]);
    return item;
  },
  //domainXPMap- aggregates total XP earned per domain across all entries
  //Reduces the array into a map  to safely handle missing fields and sum XP for each domain
  update: async (id, patch) => {
    const list = await readList(KEYS.ENTRIES);
    await writeList(KEYS.ENTRIES, list.map(e => e.id === id ? { ...e, ...patch } : e));
  },
  domainXPMap: async () => {
    const entries = await readList(KEYS.ENTRIES);
    const map = {};
    entries.forEach(e => {
      if (e.domain_xp) {
        Object.entries(e.domain_xp).forEach(([d, xp]) => {
          map[d] = (map[d] || 0) + xp;
        });
      }
    });
    return map;
  },
};

// Goals
//C,U,D
//Tracks the user's goals across three timeframes; daily, weekly, and monthly
// each goal has id,title,description,timeframe,status, progress
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
    await writeList(KEYS.GOALS, list.map(g => g.id === id ? { ...g, ...patch } : g));
  },
  remove: async (id) => {
    const list = await readList(KEYS.GOALS);
    await writeList(KEYS.GOALS, list.filter(g => g.id !== id));
  },
  //getweekly score()- returns a 0-1 score for use in plant growth model
  //Filters to activate weekly goals, averages their progress (0-100),
  //then divides by 100 to normalise to 0-1 range
  // Returns 0–1 score based on average weekly goal progress
  getWeeklyScore: async () => {
    const list = await readList(KEYS.GOALS);
    const weekly = list.filter(g => g.timeframe === 'weekly' && (g.status === 'active' || !g.status));
    if (!weekly.length) return 0;
    const avg = weekly.reduce((s, g) => s + (g.progress || 0), 0) / weekly.length;
    return avg / 100;
  },
};

//Health store
//stores one entry per day for physical health metrics
// Each entry shapes: { id, date, sleep, water, movement, logged_at }
// sleep: 0–12 (hours),
//  water: 0–10 (glasses),
//  movement: 0–120 (mins)
export const healthStore = {
  //list() return health entries across all dates
  list: () => readList(KEYS.HEALTH),


  // Get today's finds and returns today's entry or null if not logged yet
  //Uses toISOString and split to get date in YYYY-MM-DD format for comparison
  getToday: async () => {
    const list = await readList(KEYS.HEALTH);
    const today = new Date().toISOString().split('T')[0];
    return list.find(e => e.date === today) || null;
  },

  // Save (create or update) today's entry
  //Checks if an entry for today already exists
  //if yes updates it using list.map()
  //if no appends a new entry to the list 
  //logged_at stores a new entry to list
  saveToday: async (data) => {
    const list = await readList(KEYS.HEALTH);
    const today = new Date().toISOString().split('T')[0];
    const existing = list.find(e => e.date === today);
    const entry = {
      //if existing, spread it first to keep the id and date
      //if new, generate a fresh id and set todays date
      ...(existing || { id: uid(), date: today }),
      ...data,
      logged_at: new Date().toISOString(),
    };
    const updated = existing
      ? list.map(e => e.date === today ? entry : e)
      : [...list, entry];
    await writeList(KEYS.HEALTH, updated);
    return entry;
  },
  
  // Returns 0–1 score: average of (sleep/8, water/8, movement/60) for today
  //
  getTodayScore: async () => {
    const list = await readList(KEYS.HEALTH);
    const today = new Date().toISOString().split('T')[0];
    const entry = list.find(e => e.date === today);
    if (!entry) return 0;
    const sleepScore    = Math.min((entry.sleep    || 0) / 8,   1);
    const waterScore    = Math.min((entry.water    || 0) / 8,   1);
    const movementScore = Math.min((entry.movement || 0) / 60,  1);
    return (sleepScore + waterScore + movementScore) / 3;
  },
};