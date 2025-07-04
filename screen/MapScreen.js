import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Modal, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddSpotModal from '../components/AddSpotModal';
import { getUser, getPublicSpots, addPublicSpot } from '../lib/supabaseClient';
import { MaterialIcons } from '@expo/vector-icons';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [publicSpots, setPublicSpots] = useState([]);
  const [privateSpots, setPrivateSpots] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [addingMode, setAddingMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSpotCoords, setNewSpotCoords] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [spotModalVisible, setSpotModalVisible] = useState(false);

  const mapRef = useRef(null);

  const focusOnUserLocation = async () => {
    const loc = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    mapRef.current?.animateToRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'Please enable location access.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      const user = await getUser();
      if (user) setUserEmail(user.email);
      fetchPublicSpots();
      fetchPrivateSpots();
    })();
  }, []);

  const fetchPublicSpots = async () => {
    const data = await getPublicSpots();
    setPublicSpots(data || []);
  };

  const fetchPrivateSpots = async () => {
    try {
      const stored = await AsyncStorage.getItem('private_spots');
      setPrivateSpots(JSON.parse(stored) || []);
    } catch (e) {
      console.error(e);
    }
  };

  const savePrivateSpot = async (spot) => {
    try {
      const updated = [...privateSpots, spot];
      setPrivateSpots(updated);
      await AsyncStorage.setItem('private_spots', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMapPress = (e) => {
    if (!addingMode) return;
    setNewSpotCoords(e.nativeEvent.coordinate);
    setModalVisible(true);
    setAddingMode(false);
  };

  const handleAddSpot = async (data, isPublic) => {
    if (!newSpotCoords) return;

    const spot = {
      name: data.name,
      description: data.description,
      activity: data.activity,
      subActivities: data.subActivities || [],
      latitude: newSpotCoords.latitude,
      longitude: newSpotCoords.longitude,
      user_email: userEmail,
    };

    if (isPublic) {
      if (!userEmail) {
        Alert.alert('Non connecté', 'Veuillez vous connecter pour ajouter un point public.');
        return;
      }

      const result = await addPublicSpot(spot);
      if (!result || result.success === false) {
        Alert.alert('Erreur', 'Ajout du point public échoué.');
        return;
      }

      await fetchPublicSpots();
      Alert.alert('Succès', 'Le spot public a été ajouté.');
    } else {
      await savePrivateSpot(spot);
      await fetchPrivateSpots();
      Alert.alert('Succès', 'Le spot privé a été ajouté.');
    }

    setModalVisible(false);
    setNewSpotCoords(null);
  };

  const handleSelectSpot = (spot) => {
    setSelectedSpot(spot);
    setSpotModalVisible(true);
  };

  const handleDeletePrivateSpot = async () => {
    const updated = privateSpots.filter(
      (s) =>
        !(s.latitude === selectedSpot.latitude &&
          s.longitude === selectedSpot.longitude)
    );
    setPrivateSpots(updated);
    await AsyncStorage.setItem('private_spots', JSON.stringify(updated));
    setSpotModalVisible(false);
    setSelectedSpot(null);
  };

  const getPublicMarkerColor = (spot) => {
    switch (spot.activity) {
      case 'Peche': return 'blue';
      case 'Camping': return 'green';
      case 'Sentier 4 roues': return '#8B4513';
      case 'Sentier pédestre': return '#40E0D0';
      case 'Relais routier': return '#9370DB';
      case 'Descente de bateau': return '#4682B4';
      default: return 'blue';
    }
  };

  const openInGoogleMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  const navigateToLocation = (lat, lng) => {
    const url = `google.navigation:q=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (!region) {
    return (
      <View style={styles.center}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.containerWithPadding}>
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {publicSpots.map((spot, index) => (
          <Marker
            key={`pub-${index}`}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            pinColor={getPublicMarkerColor(spot)}
            onPress={() => handleSelectSpot({ ...spot, isPublic: true })}
          />
        ))}
        {privateSpots.map((spot, index) => (
          <Marker
            key={`priv-${index}`}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            pinColor="red"
            onPress={() => handleSelectSpot({ ...spot, isPublic: false })}
          />
        ))}
      </MapView>

      <View style={styles.footer}>
        <View style={styles.floatingButtons}>
          <TouchableOpacity style={styles.gpsButton} onPress={focusOnUserLocation}>
            <MaterialIcons name="my-location" size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, addingMode && styles.addButtonTransparent]}
            onPress={() => {
              if (addingMode) {
                setAddingMode(false);
                setNewSpotCoords(null);
              } else {
                setAddingMode(true);
              }
            }}
          >
            <Text
              style={[
                styles.addButtonText,
                addingMode && styles.addButtonTextTransparent,
                addingMode && styles.addButtonTextRotated,
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {modalVisible && (
        <AddSpotModal
          coords={newSpotCoords}
          onClose={() => {
            setModalVisible(false);
            setNewSpotCoords(null);
          }}
          onSubmit={handleAddSpot}
        />
      )}

      {spotModalVisible && selectedSpot && (
        <Modal transparent animationType="fade" visible={spotModalVisible}>
          <View style={styles.spotOverlay}>
            <View style={styles.spotCard}>
              <TouchableOpacity
                style={styles.closeXButton}
                onPress={() => {
                  setSpotModalVisible(false);
                  setSelectedSpot(null);
                }}
              >
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.spotTitle}>{selectedSpot.name}</Text>
              <Text style={styles.spotText}>{selectedSpot.description}</Text>
              <Text style={styles.spotText}>Activité: {selectedSpot.activity}</Text>
              <Text style={styles.spotText}>Statut: {selectedSpot.isPublic ? 'Public' : 'Privé'}</Text>
              {selectedSpot.subActivities?.length > 0 && (
                <Text style={styles.spotText}>Sous-activités: {selectedSpot.subActivities.join(', ')}</Text>
              )}

              <View style={styles.mapActions}>
                <TouchableOpacity onPress={() => navigateToLocation(selectedSpot.latitude, selectedSpot.longitude)}>
                  <Text style={styles.mapActionText}>Naviguer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openInGoogleMaps(selectedSpot.latitude, selectedSpot.longitude)}>
                  <Text style={styles.mapActionText}>Ouvrir dans Maps</Text>
                </TouchableOpacity>
              </View>

              {!selectedSpot.isPublic && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.editBtn]}>
                    <Text style={styles.btnText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDeletePrivateSpot}>
                    <Text style={styles.btnText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerWithPadding: {
    flex: 1,
    paddingBottom: 50,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 115,
    right: 20,
  },
  floatingButtons: {
    alignItems: 'center',
  },
  gpsButton: {
    backgroundColor: '#fff',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  gpsButtonText: {
    fontSize: 20,
  },
  addButton: {
    backgroundColor: '#2196f3',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  addButtonTransparent: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  addButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButtonTextTransparent: {
    color: '#2196f3',
  },
  addButtonTextRotated: {
    transform: [{ rotate: '45deg' }],
  },
  spotOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  spotCard: {
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
  spotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  spotText: {
    fontSize: 14,
    marginBottom: 6,
  },
  mapActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  mapActionText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#2196f3',
    marginRight: 6,
  },
  deleteBtn: {
    backgroundColor: '#e53935',
    marginLeft: 6,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
