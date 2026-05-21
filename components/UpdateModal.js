import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadAndInstall } from '../lib/updater';
import { colors, spacing, radius, shadow } from '../lib/theme';

function formatSize(bytes) {
  if (!bytes) return '';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UpdateModal({ update, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleInstall = async () => {
    setDownloading(true);
    setProgress(0);
    try {
      await downloadAndInstall(update, setProgress);
    } catch (e) {
      Alert.alert(
        'Mise à jour impossible',
        String(e?.message || e) +
          "\n\nSi Android refuse l'installation, autorise l'app à installer des sources inconnues dans les paramètres."
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={!!update}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="cloud-download" size={22} color={colors.accent} />
            </View>
            <Text style={styles.title}>Nouvelle version</Text>
          </View>

          <View style={styles.versionRow}>
            <Text style={styles.versionCurrent}>v{update.currentVersion}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textDim} />
            <Text style={styles.versionNew}>v{update.version}</Text>
            {update.sizeBytes ? (
              <Text style={styles.versionSize}>· {formatSize(update.sizeBytes)}</Text>
            ) : null}
          </View>

          {update.notes ? (
            <ScrollView style={styles.notes}>
              <Text style={styles.notesText}>{update.notes}</Text>
            </ScrollView>
          ) : null}

          {downloading && (
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]}
              />
              <Text style={styles.progressLabel}>
                Téléchargement… {Math.round(progress * 100)}%
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={onClose}
              disabled={downloading}
            >
              <Text style={styles.skipBtnText}>Plus tard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.installBtn, downloading && styles.installBtnDisabled]}
              onPress={handleInstall}
              disabled={downloading}
              activeOpacity={0.85}
            >
              <Text style={styles.installBtnText}>
                {downloading ? 'En cours…' : 'Installer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },

  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  versionCurrent: { color: colors.textDim, fontFamily: 'monospace', fontSize: 13 },
  versionNew: { color: colors.accent, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  versionSize: { color: colors.textDim, fontSize: 12 },

  notes: {
    maxHeight: 220,
    marginVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notesText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },

  progressBar: {
    height: 32,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  progressLabel: {
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  skipBtn: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  skipBtnText: { color: colors.textMuted, fontWeight: '600' },
  installBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  installBtnDisabled: { opacity: 0.5 },
  installBtnText: { color: colors.text, fontWeight: '700' },
});
