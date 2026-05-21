import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Phase 1 placeholder. Real BLE proximity exchange (advertise / scan / signed
// bundle transfer) lands in Phase 3.
export default function ExchangeScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="bluetooth-outline" size={64} color="#bbb" />
      <Text style={styles.title}>Échanger des spots</Text>
      <Text style={styles.muted}>
        Bientôt: partage P2P par proximité Bluetooth, sans compte ni serveur.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9f9f9',
  },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  muted: { color: '#888', textAlign: 'center' },
});
