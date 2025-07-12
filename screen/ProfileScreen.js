import React, { useEffect, useState } from 'react';
import { View, Text, Image, Button, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [publicSpotCount, setPublicSpotCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté.');

      // 1. Récupérer le profil
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) throw new Error('Erreur profil utilisateur.');

      setProfile(profileData);

      // 2. Récupérer le nombre de spots publics
      const { count, error: spotError } = await supabase
        .from('public_spots')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', user.email); // Modifie si tu utilises user_id au lieu de email
      if (spotError) throw new Error('Erreur spots publics.');

      setPublicSpotCount(count || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Chargement du profil…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Impossible de charger le profil.</Text>
        <Button title="Réessayer" onPress={fetchData} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 24, backgroundColor: '#f9f9f9' }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity>
          <Image
            source={
              profile.avatar_url
                ? { uri: profile.avatar_url }
                : require('../assets/avatar-default.png')
            }
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 2,
              borderColor: '#9ed9cc',
              marginBottom: 10,
            }}
          />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
          {profile.prenom} {profile.nom}
        </Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 2 }}>
          Membre depuis le {new Date(profile.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>Bio :</Text>
        <Text style={{ backgroundColor: '#e9e9e9', borderRadius: 6, padding: 8, fontSize: 15 }}>
          {profile.bio ? profile.bio : 'Aucune bio.'}
        </Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>Activités pratiquées :</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {profile.activities && profile.activities.length > 0 ? (
            profile.activities.map((activity, idx) => (
              <Text
                key={idx}
                style={{
                  backgroundColor: '#bce6e1',
                  borderRadius: 8,
                  margin: 2,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  fontSize: 14,
                }}>
                {activity}
              </Text>
            ))
          ) : (
            <Text style={{ color: '#888' }}>Aucune activité sélectionnée.</Text>
          )}
        </View>
      </View>

      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontWeight: 'bold' }}>Spots publics ajoutés :</Text>
        <Text style={{ fontSize: 16, marginTop: 4 }}>{publicSpotCount}</Text>
      </View>

      <Button title="Déconnexion" color="#b13d3d" onPress={handleLogout} />
    </ScrollView>
  );
}
