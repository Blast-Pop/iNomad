import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function signInWithEmail(email, password, persist = true) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { shouldPersistSession: persist },
  });
  return { user: data?.user || null, error };
}

export async function signUpWithEmail(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  return { user: data?.user || null, error };
}

export async function getUser() {
  const session = await supabase.auth.getSession();
  if (!session?.data?.session) {
    console.log('❌ Pas de session active');
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('❌ Erreur récupération utilisateur :', error);
    return null;
  }

  return data?.user || null;
}

export async function getPublicSpots() {
  const { data, error } = await supabase.from('public_spots').select('*');
  if (error) {
    return [];
  }
  return data;
}

export async function addPublicSpot(spot) {
  const { subActivities, ...spotWithoutSubActivities } = spot;

  console.log('📤 Envoi du spot public à Supabase...', spotWithoutSubActivities);

  const { data, error } = await supabase
    .from('public_spots')
    .insert([spotWithoutSubActivities]);

  if (error) {
    console.error('❌ Erreur Supabase (addPublicSpot):', error);
    return { success: false, error };
  }

  console.log('✅ Spot public ajouté.');
  return { success: true };
}

export async function signOut() {
  await supabase.auth.signOut();
}
