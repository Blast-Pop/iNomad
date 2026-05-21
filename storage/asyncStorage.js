import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdentity } from '../lib/identity';

const STORAGE_KEY = 'spots';

// Time-sortable pseudo-random id, sufficient for local-only collision avoidance.
// Replaced by signed UUIDs once Phase 2 identity ships.
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function ensureSpotShape(spot) {
  return {
    id: spot.id || generateId(),
    name: spot.name,
    description: spot.description || '',
    activity: spot.activity,
    latitude: spot.latitude,
    longitude: spot.longitude,
    createdAt: spot.createdAt || new Date().toISOString(),
    author: spot.author || null,
  };
}

export async function getSpots() {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  const raw = JSON.parse(json);
  // Migrate any pre-0.2 records lacking id/createdAt on first read.
  let dirty = false;
  const migrated = raw.map((s) => {
    if (!s.id || !s.createdAt) {
      dirty = true;
      return ensureSpotShape(s);
    }
    return s;
  });
  if (dirty) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

export async function saveSpot(spot) {
  const all = await getSpots();
  // Tag the spot with our own peerId so we can distinguish ours from those
  // received from peers (Phase 3). If identity isn't ready yet, leave null.
  let author = spot.author || null;
  if (!author) {
    const id = await getIdentity();
    if (id) author = id.peerId;
  }
  const next = [...all, ensureSpotShape({ ...spot, author })];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function deleteSpotById(id) {
  const all = await getSpots();
  const next = all.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function updateSpotById(id, patch) {
  const all = await getSpots();
  const next = all.map((s) => (s.id === id ? { ...s, ...patch } : s));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
