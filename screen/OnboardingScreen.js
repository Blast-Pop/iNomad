import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { setPseudo } from '../lib/identity';

export default function OnboardingScreen({ identity, onDone }) {
  const [pseudo, setPseudoLocal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleStart = async () => {
    const trimmed = pseudo.trim();
    if (!trimmed) return;
    setSubmitting(true);
    await setPseudo(trimmed);
    onDone({ ...identity, pseudo: trimmed });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.welcome}>Bienvenue sur</Text>
      <Text style={styles.brand}>iNomad</Text>
      <Text style={styles.tagline}>
        Sauvegarde tes spots outdoor — local, hors-ligne, sans compte.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Choisis un pseudo</Text>
        <TextInput
          style={styles.input}
          value={pseudo}
          onChangeText={setPseudoLocal}
          placeholder="ton pseudo"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={24}
        />
        <Text style={styles.peerId}>
          Ton peer ID: <Text style={styles.peerIdMono}>{identity.peerId}</Text>
        </Text>
        <TouchableOpacity
          style={[styles.button, (!pseudo.trim() || submitting) && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={!pseudo.trim() || submitting}
        >
          <Text style={styles.buttonText}>Commencer</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Aucune donnée n'est envoyée à un serveur. Ton identité reste sur ce téléphone.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: { width: 100, height: 100, resizeMode: 'contain', marginBottom: 20 },
  welcome: { fontSize: 18, color: '#666' },
  brand: { fontSize: 36, fontWeight: 'bold', color: '#007AFF', marginBottom: 12 },
  tagline: {
    color: '#555',
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 14,
    lineHeight: 20,
  },
  form: { width: '100%', alignItems: 'stretch' },
  label: { fontWeight: '600', marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  peerId: { color: '#666', fontSize: 12, marginBottom: 20 },
  peerIdMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#bbb' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { color: '#888', fontSize: 11, marginTop: 40, textAlign: 'center' },
});
