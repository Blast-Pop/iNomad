import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getSpots } from '../storage/asyncStorage';
import { getReceivedSpots } from '../storage/receivedSpots';
import { useIdentity } from '../lib/identityContext';
import { resetIdentity, getOrCreateIdentity } from '../lib/identity';

function initialsFor(pseudo) {
  if (!pseudo) return '?';
  const parts = pseudo.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ProfileScreen() {
  const { identity, setIdentity } = useIdentity();
  const [spotCount, setSpotCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);

  useEffect(() => {
    getSpots().then((s) => setSpotCount(s.length));
    getReceivedSpots().then((s) => setReceivedCount(s.length));
  }, []);

  const handleReset = () => {
    Alert.alert(
      'Reset identity?',
      'Ton pseudo, ton keypair et tes spots vont rester, mais tu vas générer une nouvelle identité au prochain démarrage. Continue?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetIdentity();
            const fresh = await getOrCreateIdentity();
            setIdentity(fresh);
          },
        },
      ]
    );
  };

  if (!identity) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsFor(identity.pseudo)}</Text>
      </View>
      <Text style={styles.pseudo}>{identity.pseudo}</Text>
      <Text style={styles.peerId}>peer ID: {identity.peerId}</Text>

      <View style={styles.statBlock}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Spots locaux</Text>
          <Text style={styles.statValue}>{spotCount}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Spots reçus de pairs</Text>
          <Text style={styles.statValue}>{receivedCount}</Text>
        </View>
      </View>

      <Text style={styles.note}>
        Partage tes spots par proximité dans l'onglet Échanger.
      </Text>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetText}>Reset identity</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  pseudo: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  peerId: { color: '#888', fontFamily: 'monospace', marginBottom: 32 },
  statBlock: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 8 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6e6e6',
  },
  statLabel: { fontSize: 15 },
  statValue: { fontSize: 15, fontWeight: '600' },
  note: { color: '#888', fontSize: 13, marginTop: 24, textAlign: 'center' },
  resetBtn: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e53935',
    borderRadius: 8,
  },
  resetText: { color: '#e53935', fontWeight: '600' },
});
