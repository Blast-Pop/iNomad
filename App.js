import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Button,
  ScrollView, TouchableOpacity, Switch, Alert, Modal
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase, signInWithEmail, signUpWithEmail, getUser, signOut, getPublicSpots } from './lib/supabaseClient';
import { getPrivateSpots } from './storage/asyncStorage';
import useLocationTracking from './hooks/useLocationTracking';
import AddSpotModal from './components/AddSpotModal';
import SpotDetailsModal from './components/SpotDetailsModal';
import { SafeAreaView } from 'react-native';

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

  const [hasPermission, setHasPermission] = useState(false);
  const [publicSpots, setPublicSpots] = useState([]);
  const [privateSpots, setPrivateSpots] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSpotCoords, setNewSpotCoords] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [spotModalVisible, setSpotModalVisible] = useState(false);

  const mapRef = useRef(null);
  const { location } = useLocationTracking();

  useEffect(() => {
    (async () => {
      const u = await getUser();
      if (u) setUser(u);
    })();
  }, []);

  useEffect(() => {
    if (user) loadSpots();
  }, [user]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission requise", "Active ta localisation pour voir la carte.");
          return;
        }
        setHasPermission(true);

    })();
  }, []);

  const loadSpots = async () => {
    try {
      const publics = await getPublicSpots();
      const privates = await getPrivateSpots();
      setPublicSpots(publics);
      setPrivateSpots(privates);
    } catch (e) {
      console.error('Erreur chargement des spots :', e);
    }
  };

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

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setEmail('');
    setPassword('');
  };

  const handleMapPress = (e) => {
    setNewSpotCoords(e.nativeEvent.coordinate);
    setModalVisible(true);
  };

  const centerMap = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const getMarkerColor = (spot) => {
  if (!spot.user_email) return 'red'; // privé

  switch (spot.activity) {
    case 'Peche': return 'blue';
    case 'Camping': return 'green';
    case 'Sentier 4 roues': return '#8B4513';       // brun foncé
    case 'Sentier pédestre': return '#40E0D0';       // turquoise
    case 'Relais routier': return '#9370DB';         // mauve pâle
    default: return 'blue';
  }
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

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Button title="Déconnexion" onPress={handleLogout} />

      {hasPermission && location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={handleMapPress}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {[...publicSpots, ...privateSpots].map((spot, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
              title={spot.name}
              description={spot.description}
              pinColor={getMarkerColor(spot)}
              onPress={() => {
                setSelectedSpot(spot);
                setSpotModalVisible(true);
              }}
              calloutAnchor={{ x: 0, y: 0 }}
              tracksViewChanges={false}
            />
          ))}
        </MapView>
      )}

      {modalVisible && (
        <Modal visible={modalVisible} transparent animationType="slide">
          <AddSpotModal
            coords={newSpotCoords}
            onClose={() => setModalVisible(false)}
            onRefresh={loadSpots}
          />
        </Modal>
      )}

      {spotModalVisible && selectedSpot && (
        <Modal visible={spotModalVisible} transparent animationType="fade">
          <SpotDetailsModal
            spot={selectedSpot}
            onClose={() => setSpotModalVisible(false)}
            onRefresh={loadSpots}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  safeContainer: { flex: 1, backgroundColor: '#fff' }, // ✅ AJOUTÉ
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  input: { borderBottomWidth: 1, padding: 6, width: '100%', marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  switchLabel: { marginLeft: 10 },
  link: { marginTop: 10, color: 'blue', textAlign: 'center' },
  map: { flex: 1 },
});