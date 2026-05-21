import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Modal,
  Linking,
} from 'react-native';
import {
  Map,
  Camera,
  UserLocation,
  Marker,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AddSpotModal from '../components/AddSpotModal';
import { getSpots, saveSpot, deleteSpotById } from '../storage/asyncStorage';
import { getReceivedSpots, deleteReceivedSpot } from '../storage/receivedSpots';

// Free OSS vector tiles via OpenFreeMap (OpenStreetMap data, no API key, no tracking).
// Swap to another MapLibre-compatible style URL if you want a different look.
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const DEFAULT_ZOOM = 13;

const ACTIVITY_COLORS = {
  Peche: '#1976d2',
  Camping: '#388e3c',
  'Sentier 4 roues': '#8B4513',
  'Sentier pédestre': '#00897b',
  'Relais routier': '#7b1fa2',
  'Descente de bateau': '#0277bd',
};

function colorForActivity(activity) {
  return ACTIVITY_COLORS[activity] || '#e53935';
}

export default function MapScreen() {
  const [userCoord, setUserCoord] = useState(null);
  const [cameraCoord, setCameraCoord] = useState(null);
  const [spots, setSpots] = useState([]);
  const [received, setReceived] = useState([]);
  const [addingMode, setAddingMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSpotCoords, setNewSpotCoords] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [spotModalVisible, setSpotModalVisible] = useState(false);

  const cameraRef = useRef(null);

  const refresh = async () => {
    setSpots(await getSpots());
    setReceived(await getReceivedSpots());
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Localisation requise', "Active l'accès à la position.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coord = [loc.coords.longitude, loc.coords.latitude];
      setUserCoord(coord);
      setCameraCoord(coord);
      await refresh();
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [])
  );

  const focusOnUserLocation = async () => {
    const loc = await Location.getCurrentPositionAsync({});
    const coord = [loc.coords.longitude, loc.coords.latitude];
    setUserCoord(coord);
    cameraRef.current?.setCamera({
      centerCoordinate: coord,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 500,
    });
  };

  const handleMapPress = (event) => {
    if (!addingMode) return;
    // MapLibre RN delivers a NativeSyntheticEvent<PressEvent> where
    // nativeEvent.lngLat is the [longitude, latitude] tuple.
    const lngLat = event?.nativeEvent?.lngLat;
    if (!lngLat) return;
    const [longitude, latitude] = lngLat;
    setNewSpotCoords({ latitude, longitude });
    setModalVisible(true);
    setAddingMode(false);
  };

  const handleAddSpot = async (data) => {
    if (!newSpotCoords) return;
    const updated = await saveSpot({
      ...data,
      latitude: newSpotCoords.latitude,
      longitude: newSpotCoords.longitude,
    });
    setSpots(updated);
    setModalVisible(false);
    setNewSpotCoords(null);
  };

  const handleDeleteSpot = async () => {
    if (!selectedSpot) return;
    if (selectedSpot.isReceived) {
      const updated = await deleteReceivedSpot(selectedSpot.id);
      setReceived(updated);
    } else {
      const updated = await deleteSpotById(selectedSpot.id);
      setSpots(updated);
    }
    setSpotModalVisible(false);
    setSelectedSpot(null);
  };

  const openInGoogleMaps = (lat, lng) => {
    Linking.openURL(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`);
  };

  const navigateToLocation = (lat, lng) => {
    // Use a geo: URI which any installed nav app (OSMAnd, Organic Maps, Google Maps, etc.) can handle
    Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}`);
  };

  if (!cameraCoord) {
    return (
      <View style={styles.center}>
        <Text>Chargement de la carte…</Text>
      </View>
    );
  }

  return (
    <View style={styles.containerWithPadding}>
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        onPress={handleMapPress}
        attribution
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: cameraCoord, zoomLevel: DEFAULT_ZOOM }}
        />
        <UserLocation visible />

        {spots.map((spot) => (
          <Marker
            key={`own-${spot.id}`}
            id={`own-${spot.id}`}
            coordinate={[spot.longitude, spot.latitude]}
            onPress={() => {
              setSelectedSpot(spot);
              setSpotModalVisible(true);
            }}
          >
            <View
              style={[
                styles.ownPin,
                { backgroundColor: colorForActivity(spot.activity) },
              ]}
            />
          </Marker>
        ))}

        {received.map((spot) => (
          <Marker
            key={`recv-${spot.id}`}
            id={`recv-${spot.id}`}
            coordinate={[spot.longitude, spot.latitude]}
            onPress={() => {
              setSelectedSpot({ ...spot, isReceived: true });
              setSpotModalVisible(true);
            }}
          >
            <View
              style={[
                styles.receivedPin,
                { backgroundColor: colorForActivity(spot.activity) },
              ]}
            >
              <Ionicons name="star" size={14} color="#fff" />
            </View>
          </Marker>
        ))}
      </Map>

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
              {selectedSpot.isReceived && selectedSpot.receivedFrom && (
                <Text style={styles.fromBadge}>
                  ⭐ reçu de {selectedSpot.receivedFrom.pseudo || selectedSpot.receivedFrom.peerId}
                </Text>
              )}
              <Text style={styles.spotText}>{selectedSpot.description}</Text>
              <Text style={styles.spotText}>Activité: {selectedSpot.activity}</Text>

              <View style={styles.mapActions}>
                <TouchableOpacity
                  onPress={() => navigateToLocation(selectedSpot.latitude, selectedSpot.longitude)}
                >
                  <Text style={styles.mapActionText}>Naviguer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openInGoogleMaps(selectedSpot.latitude, selectedSpot.longitude)}
                >
                  <Text style={styles.mapActionText}>Voir sur OSM</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDeleteSpot}>
                  <Text style={styles.btnText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerWithPadding: { flex: 1, paddingBottom: 50 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: { position: 'absolute', bottom: 115, right: 20 },
  floatingButtons: { alignItems: 'center' },
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
  addButton: {
    backgroundColor: '#2196f3',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  addButtonTransparent: { backgroundColor: 'rgba(33, 150, 243, 0.2)' },
  addButtonText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  addButtonTextTransparent: { color: '#2196f3' },
  addButtonTextRotated: { transform: [{ rotate: '45deg' }] },
  ownPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  receivedPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
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
  closeXButton: { position: 'absolute', top: 10, right: 12, zIndex: 10 },
  closeX: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  spotTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  fromBadge: { color: '#888', fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  spotText: { fontSize: 14, marginBottom: 6 },
  mapActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  mapActionText: { color: '#2196f3', fontWeight: 'bold' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  deleteBtn: { backgroundColor: '#e53935' },
  btnText: { color: 'white', fontWeight: 'bold' },
});
