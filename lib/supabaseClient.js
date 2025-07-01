import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kllprolqpgakiybapdft.supabase.co'; // remplace par ton URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbHByb2xxcGdha2l5YmFwZGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTYxMjUsImV4cCI6MjA2Njg5MjEyNX0.z3XQ3xh_ZxrRXWCOg9tzBxZ_nxVl64RPkfwGmLsG_Ow'; // remplace par ta vraie clé

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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



/** 🌍 Spots publics (DB Supabase) */
export async function getPublicSpots() {
  const { data, error } = await supabase.from('public_spots').select('*');
  if (error) {
    return [];
  }
  return data;
}

/** 📤 Ajouter un spot public */
export async function addPublicSpot(spot) {
  console.log('📤 Envoi du spot public à Supabase...', spot);
  const { data, error } = await supabase.from('public_spots').insert([spot]);

  if (error) {
    console.error('❌ Erreur Supabase (addPublicSpot):', error);
    return null;
  }

  console.log('✅ Spot public ajouté :', data);
  return data;
}


export async function signOut() {
  await supabase.auth.signOut();
}