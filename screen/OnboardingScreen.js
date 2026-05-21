import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setPseudo } from '../lib/identity';
import { colors, spacing, radius, shadow } from '../lib/theme';

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
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.brandBlock}>
        <View style={styles.logoCircle}>
          <Ionicons name="compass" size={48} color={colors.accent} />
        </View>
        <Text style={styles.brand}>iNomad</Text>
        <Text style={styles.tagline}>
          Tes spots outdoor, hors-ligne et signés crypto.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Choisis un pseudo</Text>
        <TextInput
          style={styles.input}
          value={pseudo}
          onChangeText={setPseudoLocal}
          placeholder="ton pseudo"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={24}
          autoFocus
        />

        <View style={styles.peerCard}>
          <View style={styles.peerRow}>
            <Ionicons name="finger-print" size={16} color={colors.accent} />
            <Text style={styles.peerLabel}>Ton peer ID</Text>
          </View>
          <Text style={styles.peerIdMono}>{identity.peerId}</Text>
          <Text style={styles.peerNote}>
            Lié à ce téléphone — restera le même même si tu réinstalles l'app.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, (!pseudo.trim() || submitting) && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={!pseudo.trim() || submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Commencer</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Aucune donnée envoyée à un serveur. Tout reste sur ton téléphone.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    paddingTop: spacing.xxl + 24,
  },
  brandBlock: { alignItems: 'center', marginBottom: spacing.xxl + 8 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  brand: { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  tagline: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },

  form: { gap: spacing.md },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bgElevated,
    color: colors.text,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    fontSize: 17,
    borderWidth: 1,
    borderColor: colors.border,
  },

  peerCard: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: spacing.sm,
  },
  peerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  peerLabel: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  peerIdMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.text,
    fontSize: 15,
    marginBottom: 6,
  },
  peerNote: { color: colors.textDim, fontSize: 11, fontStyle: 'italic' },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  buttonDisabled: { backgroundColor: colors.surface, opacity: 0.5 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '700' },

  footer: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 'auto',
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
});
