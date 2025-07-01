import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Switch,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { savePrivateSpot } from '../storage/asyncStorage';
import { addPublicSpot, getUser } from '../lib/supabaseClient';

export default function AddSpotModal({ coords, onClose, onRefresh }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activity, setActivity] = useState('Peche');
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Champ obligatoire", "Le nom du spot est requis.");
      return;
    }

    const spot = {
      name: name.trim(),
      description: description.trim() || 'Aucune description',
      latitude: coords.latitude,
      longitude: coords.longitude,
      activity,
      isPublic
    };

    try {
      if (isPublic) {
        const user = await getUser();
        if (!user) {
          Alert.alert("Connexion requise", "Tu dois être connecté pour publier un spot public.");
          return;
        }

        const { isPublic, ...cleanSpot } = spot;
        const spotToSend = { ...cleanSpot, user_email: user.email };

        console.log('📤 Spot public envoyé :', spotToSend);
        await addPublicSpot(spotToSend);
      } else {
        console.log('💾 Spot privé enregistré localement');
        await savePrivateSpot(spot);
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error('❌ Erreur lors de l’enregistrement du spot :', err);
      Alert.alert("Erreur", "Impossible d’enregistrer ce spot.");
    }
  };

  return (
    <View style={styles.modal}>
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

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Activité :</Text>
        <Picker
          selectedValue={activity}
          onValueChange={(itemValue) => setActivity(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="🎣 Pêche" value="Peche" />
          <Picker.Item label="🏕 Camping" value="Camping" />
          <Picker.Item label="🛻 Sentier 4 roues" value="Sentier 4 roues" />
          <Picker.Item label="🥾 Sentier pédestre" value="Sentier pédestre" />
          <Picker.Item label="🛣 Relais routier" value="Relais routier" />
        </Picker>
      </View>

      <View style={styles.switchContainer}>
        <Text>Spot public ?</Text>
        <Switch value={isPublic} onValueChange={setIsPublic} />
      </View>
      <View style={styles.buttonRow}>
      <Button title="Enregistrer" onPress={handleSave} />
      <Button title="Annuler" onPress={onClose} color="red" />
    </View>

    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 12,
    padding: 6
  },
  pickerContainer: {
    marginBottom: 12
  },
  label: {
    marginBottom: 4,
    fontWeight: '600'
  },
  picker: {
    backgroundColor: '#eee'
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 10,
  marginTop: 15,
}

});
