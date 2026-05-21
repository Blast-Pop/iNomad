import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Modal,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { Map, Camera, UserLocation, Marker } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AddSpotModal from '../components/AddSpotModal';
import { getSpots, saveSpot, deleteSpotById } from '../storage/asyncStorage';
import { getReceivedSpots, deleteReceivedSpot } from '../storage/receivedSpots';
import { colors, spacing, radius, shadow, colorForActivity, MAP_STYLE_URL } from '../lib/theme';

const DEFAULT_ZOOM = 13;

export default function MapScreen() {
  const [cameraCoord, setCameraCoord] = useState(null);
  const [spots, setSpots] = useState([]);
  const [received, setReceived] = useState([]);
  const [addingMode, setAddingMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSpotCoords, setNewSpotCoords] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [spotModalVisible, setSpotModalVisible] = useState(false);
  const [tapRipple, setTapRipple] = useState(null);

  const cameraRef = useRef(null);
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const bannerSlide = useRef(new Animated.Value(-100)).current;

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
      setCameraCoord([loc.coords.longitude, loc.coords.latitude]);
      await refresh();
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  // Animate the top banner when adding mode toggles.
  useEffect(() => {
    Animated.timing(bannerSlide, {
      toValue: addingMode ? 0 : -100,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [addingMode, bannerSlide]);

  const focusOnUserLocation = async () => {
    const loc = await Location.getCurrentPositionAsync({});
    const coord = [loc.coords.longitude, loc.coords.latitude];
    cameraRef.current?.setCamera({
      centerCoordinate: coord,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 500,
    });
  };

  const playRipple = (coord) => {
    setTapRipple(coord);
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.6);
    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setTapRipple(null));
  };

  const handleMapPress = (event) => {
    if (!addingMode) return;
    const lngLat = event?.nativeEvent?.lngLat;
    if (!lngLat) return;
    const [longitude, latitude] = lngLat;
    playRipple([longitude, latitude]);
    setNewSpotCoords({ latitude, longitude });
    setTimeout(() => {
      setModalVisible(true);
      setAddingMode(false);
    }, 280);
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

  const openInOSM = (lat, lng) => {
    Linking.openURL(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`);
  };

  const navigateToLocation = (lat, lng) => {
    Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}`);
  };

  if (!cameraCoord) {
    return (
      <View style={styles.loading}>
        <Ionicons name="map-outline" size={48} color={colors.textDim} />
        <Text style={styles.loadingText}>Chargement de la carte…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
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
            <View style={styles.pinShadow}>
              <View style={[styles.ownPin, { backgroundColor: colorForActivity(spot.activity) }]}>
                <View style={styles.ownPinInner} />
              </View>
            </View>
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
            <View style={styles.pinShadow}>
              <View
                style={[styles.receivedPin, { backgroundColor: colorForActivity(spot.activity) }]}
              >
                <Ionicons name="star" size={12} color={colors.text} />
              </View>
            </View>
          </Marker>
        ))}

        {tapRipple && (
          <Marker id="tap-ripple" coordinate={tapRipple}>
            <Animated.View
              style={[
                styles.ripple,
                { opacity: rippleOpacity, transform: [{ scale: rippleScale }] },
              ]}
            />
          </Marker>
        )}
      </Map>

      {/* Top banner shown while in adding mode */}
      <Animated.View
        pointerEvents={addingMode ? 'auto' : 'none'}
        style={[styles.banner, { transform: [{ translateY: bannerSlide }] }]}
      >
        <Ionicons name="location-outline" size={20} color={colors.accent} />
        <Text style={styles.bannerText}>Tape sur la carte pour placer ton spot</Text>
        <TouchableOpacity
          style={styles.bannerCancel}
          onPress={() => {
            setAddingMode(false);
            setNewSpotCoords(null);
          }}
        >
          <Text style={styles.bannerCancelText}>Annuler</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Floating action stack */}
      <View style={styles.fabStack}>
        <TouchableOpacity style={styles.fabSecondary} onPress={focusOnUserLocation}>
          <MaterialIcons name="my-location" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabPrimary, addingMode && styles.fabPrimaryActive]}
          onPress={() => {
            setAddingMode((m) => !m);
            setNewSpotCoords(null);
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name={addingMode ? 'close' : 'add'}
            size={28}
            color={addingMode ? colors.accent : colors.text}
          />
        </TouchableOpacity>
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
        <Modal transparent animationType="slide" visible={spotModalVisible}>
          <View style={styles.detailsBackdrop}>
            <View style={styles.detailsSheet}>
              <View style={styles.detailsHandle} />
              <View style={styles.detailsHeader}>
                <View
                  style={[
                    styles.detailsActivityDot,
                    { backgroundColor: colorForActivity(selectedSpot.activity) },
                  ]}
                />
                <Text style={styles.detailsTitle} numberOfLines={1}>
                  {selectedSpot.name}
                </Text>
                <TouchableOpacity
                  style={styles.detailsClose}
                  onPress={() => {
                    setSpotModalVisible(false);
                    setSelectedSpot(null);
                  }}
                >
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {selectedSpot.isReceived && selectedSpot.receivedFrom && (
                <View style={styles.detailsBadge}>
                  <Ionicons name="star" size={12} color={colors.accent} />
                  <Text style={styles.detailsBadgeText}>
                    reçu de {selectedSpot.receivedFrom.pseudo || selectedSpot.receivedFrom.peerId}
                  </Text>
                </View>
              )}

              {selectedSpot.description ? (
                <Text style={styles.detailsDesc}>{selectedSpot.description}</Text>
              ) : null}

              <View style={styles.detailsRow}>
                <Ionicons name="trail-sign-outline" size={16} color={colors.textMuted} />
                <Text style={styles.detailsRowText}>{selectedSpot.activity}</Text>
              </View>

              <View style={styles.detailsActions}>
                <TouchableOpacity
                  style={styles.detailsActionBtn}
                  onPress={() =>
                    navigateToLocation(selectedSpot.latitude, selectedSpot.longitude)
                  }
                >
                  <Ionicons name="navigate-outline" size={18} color={colors.text} />
                  <Text style={styles.detailsActionText}>Naviguer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailsActionBtn}
                  onPress={() => openInOSM(selectedSpot.latitude, selectedSpot.longitude)}
                >
                  <Ionicons name="open-outline" size={18} color={colors.text} />
                  <Text style={styles.detailsActionText}>Voir sur OSM</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.detailsDelete} onPress={handleDeleteSpot}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={styles.detailsDeleteText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  map: { flex: 1 },

  banner: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    ...shadow.card,
  },
  bannerText: { color: colors.text, fontSize: 14, flex: 1, fontWeight: '500' },
  bannerCancel: { paddingVertical: 4, paddingHorizontal: spacing.sm },
  bannerCancelText: { color: colors.accent, fontWeight: '700', fontSize: 13 },

  fabStack: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl + 40,
    alignItems: 'center',
    gap: spacing.md,
  },
  fabSecondary: {
    backgroundColor: colors.bgElevated,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  fabPrimary: {
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.card,
  },
  fabPrimaryActive: {
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: colors.accent,
  },

  // Map pins
  pinShadow: {
    ...shadow.pin,
  },
  ownPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownPinInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bg,
  },
  receivedPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
  },

  // Spot details bottom sheet
  detailsBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  detailsSheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 16,
  },
  detailsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailsActivityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailsTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text },
  detailsClose: { padding: 4 },
  detailsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  detailsBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  detailsDesc: { color: colors.textMuted, fontSize: 14, marginTop: spacing.md, lineHeight: 20 },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailsRowText: { color: colors.text, fontSize: 14 },
  detailsActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  detailsActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  detailsActionText: { color: colors.text, fontWeight: '600' },
  detailsDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  detailsDeleteText: { color: colors.danger, fontWeight: '600' },
});
