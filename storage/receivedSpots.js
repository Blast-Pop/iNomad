import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'received_spots';

// Spots received from peers live in a separate bucket so we can:
// - display them with a distinct visual (badge "from @peer")
// - keep them read-only (can't edit someone else's spot, only delete locally)
// - count them separately for the profile screen

export async function getReceivedSpots() {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

function dedupeKey(spot) {
  return `${spot.id}:${spot.author || ''}`;
}

export async function mergeReceivedSpots(incoming, fromPeer) {
  const existing = await getReceivedSpots();
  const seen = new Set(existing.map(dedupeKey));
  const stamped = incoming
    .map((s) => ({
      ...s,
      receivedFrom: fromPeer,
      receivedAt: new Date().toISOString(),
    }))
    .filter((s) => !seen.has(dedupeKey(s)));
  if (stamped.length === 0) return { added: 0, total: existing.length };
  const next = [...existing, ...stamped];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return { added: stamped.length, total: next.length };
}

export async function deleteReceivedSpot(id) {
  const all = await getReceivedSpots();
  const next = all.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
