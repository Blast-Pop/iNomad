import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Switch } from 'react-native';
import { signIn } from '../lib/supabaseClient';

export default function LoginForm({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  const handleLogin = async () => {
    const user = await signIn(email, password, stayLoggedIn);
    if (user) onLoginSuccess(user);
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <View style={styles.switchRow}>
        <Text>Rester connecté</Text>
        <Switch value={stayLoggedIn} onValueChange={setStayLoggedIn} />
      </View>
      <Button title="Se connecter" onPress={handleLogin} />
      <Button title="Retour" onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderBottomWidth: 1, marginBottom: 10, padding: 5 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
});
