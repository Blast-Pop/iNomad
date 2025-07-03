import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function LogoutScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // On revient à l'écran de connexion
      navigation.reset({
        index: 0,
        routes: [{ name: 'Connexion' }], // Ton écran de login dans App.js
      });
    } catch (err) {
      console.error('Erreur de déconnexion:', err.message);
      Alert.alert('Erreur', 'Déconnexion échouée');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tu veux te déconnecter ?</Text>
      <TouchableOpacity onPress={handleLogout} style={styles.button}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, marginBottom: 20 },
  button: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
