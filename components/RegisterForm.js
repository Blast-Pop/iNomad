import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Switch,
} from 'react-native';

export default function RegisterForm({ onRegister, onBack }) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = () => {
    if (!email || !password || !prenom || !nom || !dob || !acceptTerms) {
      alert('Remplis tous les champs et accepte les termes');
      return;
    }
    onRegister({ email, password, prenom, nom, dob });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <TextInput
        placeholder="Prénom"
        style={styles.input}
        value={prenom}
        onChangeText={setPrenom}
      />
      <TextInput
        placeholder="Nom"
        style={styles.input}
        value={nom}
        onChangeText={setNom}
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Date de naissance (YYYY-MM-DD)"
        style={styles.input}
        value={dob}
        onChangeText={setDob}
      />
      <View style={styles.switchRow}>
        <Switch value={acceptTerms} onValueChange={setAcceptTerms} />
        <Text style={styles.switchLabel}>J'accepte les termes</Text>
      </View>
      <View style={{ gap: 10 }}>
        <Button title="S'inscrire" onPress={handleSubmit} />
        <Button title="⬅ Retour" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  input: {
    borderBottomWidth: 1,
    padding: 6,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    marginLeft: 10,
  },
});
