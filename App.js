import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Button,
  ScrollView, TouchableOpacity, Switch, Alert, SafeAreaView
} from 'react-native';
import { supabase, signInWithEmail, signUpWithEmail, getUser, signOut } from './lib/supabaseClient';
import AppNavigation from './components/AppNavigation';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  const [screen, setScreen] = useState('home'); // home | login | register
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stayConnected, setStayConnected] = useState(true);

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [dob, setDob] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      if (u) setUser(u);
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return alert('Champs requis');
    const result = await signInWithEmail(email, password, stayConnected);
    if (result?.user) setUser(result.user);
    else alert(result?.error?.message || 'Erreur de connexion');
  };

  const handleRegister = async () => {
    if (!email || !password || !prenom || !nom || !dob || !acceptTerms) {
      return alert('Remplis tous les champs et accepte les termes');
    }
    const result = await signUpWithEmail(email, password, { prenom, nom, dob });
    if (result?.user) setUser(result.user);
    else alert(result?.error?.message || 'Erreur d’inscription');
  };

  if (!user) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { justifyContent: 'center', flex: 1 }]}>
        {screen === 'home' && (
          <>
            <Text style={styles.title}>Bienvenue sur iNomad</Text>
            <View style={{ gap: 12 }}>
              <Button title="Connexion" onPress={() => setScreen('login')} />
              <Button title="Inscription" onPress={() => setScreen('register')} />
            </View>
          </>
        )}

        {screen === 'login' && (
          <>
            <Text style={styles.title}>Connexion</Text>
            <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} />
            <TextInput placeholder="Mot de passe" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
            <View style={styles.switchRow}>
              <Switch value={stayConnected} onValueChange={setStayConnected} />
              <Text style={styles.switchLabel}>Rester connecté</Text>
            </View>
            <Button title="Se connecter" onPress={handleLogin} />
            <TouchableOpacity onPress={() => setScreen('home')}>
              <Text style={styles.link}>⬅ Retour</Text>
            </TouchableOpacity>
          </>
        )}

        {screen === 'register' && (
          <>
            <Text style={styles.title}>Inscription</Text>
            <TextInput placeholder="Prénom" style={styles.input} value={prenom} onChangeText={setPrenom} />
            <TextInput placeholder="Nom" style={styles.input} value={nom} onChangeText={setNom} />
            <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} />
            <TextInput placeholder="Mot de passe" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
            <TextInput placeholder="Date de naissance (YYYY-MM-DD)" style={styles.input} value={dob} onChangeText={setDob} />
            <View style={styles.switchRow}>
              <Switch value={acceptTerms} onValueChange={setAcceptTerms} />
              <Text style={styles.switchLabel}>J'accepte les termes</Text>
            </View>
            <Button title="S'inscrire" onPress={handleRegister} />
            <TouchableOpacity onPress={() => setScreen('home')}>
              <Text style={styles.link}>⬅ Retour</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    );
  }

  // ✅ Si l'utilisateur est connecté : on affiche le drawer avec la carte
  return (
    <NavigationContainer>
      <AppNavigation />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  input: { borderBottomWidth: 1, padding: 6, width: '100%', marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  switchLabel: { marginLeft: 10 },
  link: { marginTop: 10, color: 'blue', textAlign: 'center' },
});
