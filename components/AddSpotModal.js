import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, colorForActivity } from '../lib/theme';

const ACTIVITIES = [
  { value: 'Peche', label: 'Pêche', icon: 'fish-outline' },
  { value: 'Camping', label: 'Camping', icon: 'bonfire-outline' },
  { value: 'Sentier 4 roues', label: 'Sentier 4 roues', icon: 'car-outline' },
  { value: 'Sentier pédestre', label: 'Sentier pédestre', icon: 'walk-outline' },
  { value: 'Relais routier', label: 'Relais routier', icon: 'business-outline' },
  { value: 'Descente de bateau', label: 'Descente de bateau', icon: 'boat-outline' },
];

export default function AddSpotModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activity, setActivity] = useState('Peche');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      activity,
    });
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Nouveau spot</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              placeholder="Mon spot favori"
              placeholderTextColor={colors.textDim}
              style={styles.input}
              value={name}
              onChangeText={setName}
              maxLength={48}
              autoFocus
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Optionnelle — bon spot pour le doré le matin"
              placeholderTextColor={colors.textDim}
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={240}
            />

            <Text style={styles.label}>Activité</Text>
            <View style={styles.activityGrid}>
              {ACTIVITIES.map((a) => {
                const selected = activity === a.value;
                const tint = colorForActivity(a.value);
                return (
                  <TouchableOpacity
                    key={a.value}
                    style={[
                      styles.activityChip,
                      selected && { borderColor: tint, backgroundColor: tint + '22' },
                    ]}
                    onPress={() => setActivity(a.value)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={a.icon}
                      size={20}
                      color={selected ? tint : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.activityChipText,
                        selected && { color: colors.text, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={!name.trim()}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={20} color={colors.text} />
              <Text style={styles.saveBtnText}>Enregistrer le spot</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 16,
    maxHeight: '88%',
    ...shadow.card,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text },
  closeBtn: { padding: 4 },

  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  inputMulti: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minWidth: '47%',
  },
  activityChipText: { color: colors.textMuted, fontSize: 13, flex: 1 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
  saveBtnDisabled: { backgroundColor: colors.surface, opacity: 0.6 },
  saveBtnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
