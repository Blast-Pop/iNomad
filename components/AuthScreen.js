import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState(null); // null | 'login' | 'register'

  return (
    <View style={styles.container}>
      {!mode && (
        <>
          <Button title="Connexion" onPress={() => setMode('login')} />
          <Button title="Inscription" onPress={() => setMode('register')} />
        </>
      )}
      {mode === 'login' && (
        <LoginForm onBack={() => setMode(null)} onLoginSuccess={onLoginSuccess} />
      )}
      {mode === 'register' && (
        <RegisterForm onBack={() => setMode(null)} onRegisterSuccess={onLoginSuccess} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
});
