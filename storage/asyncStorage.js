import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'private_spots';

// Récupère tous les spots privés
export async function getPrivateSpots() {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

// Enregistre un nouveau spot privé dans le téléphone
export async function savePrivateSpot(spot) {
  const current = await getPrivateSpots();
  current.push(spot);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}
