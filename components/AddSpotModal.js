import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function AddSpotModal({ coords, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activity, setActivity] = useState('Peche');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(
      {
        name: name.trim(),
        description: description.trim() || 'Aucune description',
        activity,
      },
      isPublic
    );
  };

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeXButton} onPress={onClose}>
            <Text style={styles.closeX}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Ajouter un spot</Text>

          <TextInput
            placeholder="Nom du spot"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            placeholder="Description (optionnelle)"
            style={styles.input}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Activité :</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={activity}
              onValueChange={(itemValue) => setActivity(itemValue)}
            >
              <Picker.Item label="🎣 Pêche" value="Peche" />
              <Picker.Item label="🏕 Camping" value="Camping" />
              <Picker.Item label="🛻 Sentier 4 roues" value="Sentier 4 roues" />
              <Picker.Item label="🥾 Sentier pédestre" value="Sentier pédestre" />
              <Picker.Item label="🛣 Relais routier" value="Relais routier" />
              <Picker.Item label="🚤 Descente de bateau" value="Descente de bateau" />
            </Picker>
          </View>

          <Text style={styles.label}>Statut :</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isPublic ? styles.toggleActive : styles.toggleInactive]}
              onPress={() => setIsPublic(true)}
            >
              <Text style={styles.toggleText}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isPublic ? styles.toggleActiveRed : styles.toggleInactive]}
              onPress={() => setIsPublic(false)}
            >
              <Text style={styles.toggleText}>Privé</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.btnText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={onClose}>
              <Text style={styles.btnText}>Annuler</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    elevation: 8,
    alignItems: 'flex-start',
  },
  closeXButton: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 10,
  },
  closeX: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    marginBottom: 12,
    padding: 6,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  pickerWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleActiveRed: {
    backgroundColor: '#e53935',
  },
  toggleInactive: {
    backgroundColor: '#ccc',
  },
  toggleText: {
    color: 'white',
    fontWeight: 'bold',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  saveBtn: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 6,
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: '#e53935',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginLeft: 6,
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
