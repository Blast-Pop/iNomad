import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSpots } from '../storage/asyncStorage';
import { getReceivedSpots } from '../storage/receivedSpots';
import { useIdentity } from '../lib/identityContext';
import { clearPseudo } from '../lib/identity';
import { colors, spacing, radius, shadow } from '../lib/theme';

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

  const handleChangePseudo = () => {
    Alert.alert(
      'Changer de pseudo?',
      "Ton peer ID est lié à ce téléphone et restera le même. Tu vas seulement choisir un nouveau pseudo.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          onPress: async () => {
            await clearPseudo();
            setIdentity({ ...identity, pseudo: null });
          },
        },
      ]
    );
  };

  if (!identity) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarRing}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsFor(identity.pseudo)}</Text>
        </View>
      </View>
      <Text style={styles.pseudo}>{identity.pseudo}</Text>

      <View style={styles.peerBadge}>
        <Ionicons name="finger-print" size={12} color={colors.accent} />
        <Text style={styles.peerId}>{identity.peerId}</Text>
      </View>
      <Text style={styles.peerNote}>Lié à ce téléphone — permanent</Text>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={styles.statValue}>{spotCount}</Text>
          <Text style={styles.statLabel}>Spots locaux</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={20} color={colors.accent} />
          <Text style={styles.statValue}>{receivedCount}</Text>
          <Text style={styles.statLabel}>Reçus de pairs</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="bluetooth" size={16} color={colors.accent} />
          <Text style={styles.infoText}>
            Échanger des spots P2P dans l'onglet Échanger
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Ionicons name="cloud-offline" size={16} color={colors.accent} />
          <Text style={styles.infoText}>
            100% local — rien n'est envoyé à un serveur
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
          <Text style={styles.infoText}>
            Tes spots partagés sont signés crypto (ed25519)
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={handleChangePseudo}>
        <Ionicons name="pencil" size={16} color={colors.textMuted} />
        <Text style={styles.actionBtnText}>Changer de pseudo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: spacing.xl,
    backgroundColor: colors.bg,
    flexGrow: 1,
    alignItems: 'center',
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.card,
  },
  avatarText: { color: colors.text, fontSize: 36, fontWeight: '800' },
  pseudo: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  peerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  peerId: { color: colors.text, fontFamily: 'monospace', fontSize: 12 },
  peerNote: { color: colors.textDim, fontSize: 11, marginTop: 4, fontStyle: 'italic' },

  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12 },

  infoCard: {
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoText: { color: colors.textMuted, flex: 1, fontSize: 13 },
  infoDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  actionBtnText: { color: colors.textMuted, fontWeight: '600' },
});
