import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrivateSpots } from '../storage/asyncStorage';

export default function SpotDetailsModal({ spot, onClose, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(spot.name);
  const [editDesc, setEditDesc] = useState(spot.description);

  const isPublic = !!spot.user_email;

  const handleDelete = async () => {
    try {
      const all = await getPrivateSpots();
      const filtered = all.filter(s =>
        !(s.latitude === spot.latitude &&
          s.longitude === spot.longitude &&
          s.name === spot.name)
      );
      await AsyncStorage.setItem('private_spots', JSON.stringify(filtered));
      onRefresh();
      onClose();
    } catch (e) {
      console.error('❌ Erreur suppression :', e);
    }
  };

  const handleSave = async () => {
    try {
      const all = await getPrivateSpots();
      const updated = all.map(s => {
        if (
          s.latitude === spot.latitude &&
          s.longitude === spot.longitude &&
          s.name === spot.name
        ) {
          return {
            ...s,
            name: editName.trim(),
            description: editDesc.trim()
          };
        }
        return s;
      });
      await AsyncStorage.setItem('private_spots', JSON.stringify(updated));
      onRefresh();
      onClose();
    } catch (e) {
      console.error('❌ Erreur modification :', e);
    }
  };

  return (
    <View style={styles.modal}>
      {isEditing ? (
        <>
          <Text style={styles.title}>Modifier le spot</Text>
          <TextInput
            style={styles.input}
            value={editName}
            onChangeText={setEditName}
            placeholder="Nom"
          />
          <TextInput
            style={styles.input}
            value={editDesc}
            onChangeText={setEditDesc}
            placeholder="Description"
          />
          <View style={styles.buttonRow}>
            <Button title="Annuler" onPress={() => setIsEditing(false)} />
            <Button title="Enregistrer" onPress={handleSave} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>{spot.name}</Text>
          <Text style={{ marginBottom: 10 }}>{spot.description || 'Aucune description'}</Text>
          <Text style={{ marginBottom: 10, color: isPublic ? 'blue' : 'red' }}>
            {isPublic ? 'Spot public' : 'Spot privé'}
          </Text>
          {!isPublic && (
            <>
              <Button title="✏️ Modifier" onPress={() => setIsEditing(true)} />
              <Button title="🗑 Supprimer" color="red" onPress={handleDelete} />
            </>
          )}
          <Button title="❌ Fermer" onPress={onClose} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    marginTop: 100,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    padding: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
});
