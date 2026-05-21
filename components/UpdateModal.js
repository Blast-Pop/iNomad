import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadAndInstall } from '../lib/updater';

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
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
            <Ionicons name="cloud-download-outline" size={28} color="#2196f3" />
            <Text style={styles.title}>Nouvelle version disponible</Text>
          </View>

          <Text style={styles.versionLine}>
            <Text style={styles.versionTag}>v{update.currentVersion}</Text>
            {'  →  '}
            <Text style={styles.versionTagNew}>v{update.version}</Text>
            {update.sizeBytes ? `   (${formatSize(update.sizeBytes)})` : ''}
          </Text>

          {update.notes ? (
            <ScrollView style={styles.notes} contentContainerStyle={{ paddingVertical: 4 }}>
              <Text style={styles.notesText}>{update.notes}</Text>
            </ScrollView>
          ) : null}

          {downloading && (
            <View style={styles.progressRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.progressText}>
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
            >
              <Text style={styles.installBtnText}>
                {downloading ? 'Téléchargement…' : 'Installer'}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  versionLine: { color: '#555', marginBottom: 12 },
  versionTag: { fontFamily: 'monospace', color: '#888' },
  versionTagNew: { fontFamily: 'monospace', color: '#2196f3', fontWeight: 'bold' },
  notes: { maxHeight: 200, marginVertical: 8 },
  notesText: { color: '#333', fontSize: 13, lineHeight: 18 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressText: { marginLeft: 8, color: '#555' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  skipBtnText: { color: '#888', fontWeight: '600' },
  installBtn: {
    backgroundColor: '#2196f3',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  installBtnDisabled: { backgroundColor: '#90caf9' },
  installBtnText: { color: '#fff', fontWeight: '700' },
});
