import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getSpots } from '../storage/asyncStorage';

// Phase 1 placeholder. Full local-identity profile (ed25519 keypair, pseudo,
// avatar, peer ID) lands in Phase 2.
export default function ProfileScreen() {
  const [spotCount, setSpotCount] = useState(0);

  useEffect(() => {
    getSpots().then((s) => setSpotCount(s.length));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.muted}>
        L'identité locale et le profil complet arrivent à la prochaine étape.
      </Text>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Spots locaux</Text>
        <Text style={styles.statValue}>{spotCount}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#f9f9f9', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  muted: { color: '#888', marginBottom: 24 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  statLabel: { fontSize: 16 },
  statValue: { fontSize: 16, fontWeight: '600' },
});
