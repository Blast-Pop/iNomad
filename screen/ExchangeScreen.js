import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nearbyService } from '../lib/p2p/nearbyService';
import { ensureP2pPermissions } from '../lib/p2p/permissions';
import {
  MSG_TYPE,
  buildHelloMessage,
  buildSpotsMessage,
  buildAckMessage,
  parseMessage,
  verifySpotsMessage,
} from '../lib/p2p/protocol';
import { useIdentity } from '../lib/identityContext';
import { getSpots } from '../storage/asyncStorage';
import { mergeReceivedSpots } from '../storage/receivedSpots';

export default function ExchangeScreen() {
  const { identity } = useIdentity();
  const [permsGranted, setPermsGranted] = useState(false);
  const [state, setState] = useState(nearbyService.snapshot());
  const [busy, setBusy] = useState(false);
  const [statusLine, setStatusLine] = useState('Prêt');
  const [connectedPeer, setConnectedPeer] = useState(null);

  const peerName = identity?.pseudo
    ? `${identity.pseudo} · ${identity.peerId}`
    : identity?.peerId || 'iNomad';

  useEffect(() => {
    (async () => {
      const { granted } = await ensureP2pPermissions();
      setPermsGranted(granted);
      if (!granted) {
        setStatusLine('Permissions Bluetooth requises pour échanger.');
      }
    })();
  }, []);

  useEffect(() => {
    const offs = [
      nearbyService.on('state', setState),
      nearbyService.on('peerFound', ({ name }) => setStatusLine(`Trouvé: ${name}`)),
      nearbyService.on('peerLost', () => setState(nearbyService.snapshot())),
      nearbyService.on('invitation', ({ peerId, name }) => {
        Alert.alert(
          'Invitation reçue',
          `${name} veut se connecter. Accepter?`,
          [
            { text: 'Refuser', style: 'cancel', onPress: () => nearbyService.reject(peerId) },
            { text: 'Accepter', onPress: () => nearbyService.accept(peerId) },
          ]
        );
      }),
      nearbyService.on('connected', async ({ peerId, name }) => {
        setConnectedPeer({ peerId, name });
        setStatusLine(`Connecté à ${name}`);
        await nearbyService.sendTo(peerId, buildHelloMessage(identity));
      }),
      nearbyService.on('disconnected', ({ peerId }) => {
        setConnectedPeer((p) => (p?.peerId === peerId ? null : p));
        setStatusLine('Déconnecté');
      }),
      nearbyService.on('text', async ({ peerId, text }) => {
        const msg = parseMessage(text);
        if (!msg) return;
        if (msg.type === MSG_TYPE.HELLO) {
          setStatusLine(`Salut reçu de ${msg.from?.pseudo || peerId}`);
        } else if (msg.type === MSG_TYPE.SPOTS) {
          const valid = await verifySpotsMessage(msg);
          if (!valid) {
            Alert.alert('Signature invalide', 'Les spots reçus ont été rejetés.');
            return;
          }
          Alert.alert(
            `${msg.spots.length} spot(s) de ${msg.from?.pseudo || msg.from?.peerId}`,
            `Importer ces spots dans ta carte?`,
            [
              { text: 'Refuser', style: 'cancel' },
              {
                text: 'Importer',
                onPress: async () => {
                  const result = await mergeReceivedSpots(msg.spots, msg.from);
                  setStatusLine(`${result.added} spot(s) ajouté(s) (${result.total} reçus au total)`);
                  await nearbyService.sendTo(peerId, buildAckMessage(result.added));
                },
              },
            ]
          );
        } else if (msg.type === MSG_TYPE.ACK) {
          setStatusLine(`Confirmation: ${msg.receivedCount} spot(s) importé(s) par le pair`);
        }
      }),
    ];
    return () => offs.forEach((off) => off?.());
  }, [identity]);

  useEffect(() => {
    return () => {
      nearbyService.stopAll().catch(() => {});
    };
  }, []);

  const toggleVisible = useCallback(
    async (value) => {
      if (!permsGranted) {
        const { granted } = await ensureP2pPermissions();
        if (!granted) return;
        setPermsGranted(true);
      }
      setBusy(true);
      try {
        if (value) await nearbyService.startAdvertise(peerName);
        else await nearbyService.stopAdvertise();
      } catch (e) {
        Alert.alert('Erreur', String(e?.message || e));
      } finally {
        setBusy(false);
      }
    },
    [permsGranted, peerName]
  );

  const toggleSearch = useCallback(
    async (value) => {
      if (!permsGranted) {
        const { granted } = await ensureP2pPermissions();
        if (!granted) return;
        setPermsGranted(true);
      }
      setBusy(true);
      try {
        if (value) await nearbyService.startDiscovery(peerName);
        else await nearbyService.stopDiscovery();
      } catch (e) {
        Alert.alert('Erreur', String(e?.message || e));
      } finally {
        setBusy(false);
      }
    },
    [permsGranted, peerName]
  );

  const invite = async (peer) => {
    setBusy(true);
    try {
      await nearbyService.invite(peer.peerId);
      setStatusLine(`Demande envoyée à ${peer.name}…`);
    } catch (e) {
      Alert.alert('Erreur', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const sendSpots = async () => {
    if (!connectedPeer) return;
    const spots = await getSpots();
    if (spots.length === 0) {
      Alert.alert('Aucun spot', 'Tu n\'as pas encore de spots à partager.');
      return;
    }
    setBusy(true);
    try {
      const msg = await buildSpotsMessage(identity, spots);
      await nearbyService.sendTo(connectedPeer.peerId, msg);
      setStatusLine(`${spots.length} spot(s) envoyé(s) à ${connectedPeer.name}`);
    } catch (e) {
      Alert.alert('Erreur', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bluetooth-outline" size={32} color="#2196f3" />
        <Text style={styles.title}>Échanger des spots</Text>
        <Text style={styles.subtitle}>Partage P2P par proximité, sans serveur.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Être visible</Text>
            <Text style={styles.rowDesc}>Permettre aux autres téléphones de te trouver.</Text>
          </View>
          <Switch
            value={state.advertising}
            onValueChange={toggleVisible}
            disabled={busy}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Chercher des pairs</Text>
            <Text style={styles.rowDesc}>Scanner pour trouver d'autres téléphones iNomad.</Text>
          </View>
          <Switch
            value={state.discovering}
            onValueChange={toggleSearch}
            disabled={busy}
          />
        </View>
      </View>

      <Text style={styles.section}>Status</Text>
      <View style={styles.statusBox}>
        {busy && <ActivityIndicator size="small" style={{ marginRight: 8 }} />}
        <Text style={styles.statusText}>{statusLine}</Text>
      </View>

      {state.peers.length > 0 && (
        <>
          <Text style={styles.section}>Pairs détectés</Text>
          <View style={styles.list}>
            {state.peers.map((peer) => {
              const isConnected = state.connected.includes(peer.peerId);
              return (
                <TouchableOpacity
                  key={peer.peerId}
                  style={styles.peerRow}
                  disabled={isConnected || busy}
                  onPress={() => invite(peer)}
                >
                  <Ionicons
                    name={isConnected ? 'checkmark-circle' : 'phone-portrait-outline'}
                    size={24}
                    color={isConnected ? '#4CAF50' : '#555'}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.peerName}>{peer.name}</Text>
                    <Text style={styles.peerId}>{peer.peerId.slice(0, 16)}…</Text>
                  </View>
                  <Text style={styles.peerAction}>
                    {isConnected ? 'Connecté' : 'Inviter'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {connectedPeer && (
        <>
          <Text style={styles.section}>Connecté</Text>
          <View style={styles.connectedBox}>
            <Text style={styles.connectedName}>{connectedPeer.name}</Text>
            <TouchableOpacity style={styles.sendBtn} onPress={sendSpots} disabled={busy}>
              <Ionicons name="paper-plane-outline" size={18} color="#fff" />
              <Text style={styles.sendBtnText}>Envoyer mes spots</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {Platform.OS === 'ios' && (
        <Text style={styles.note}>
          Note: iOS et Android ne peuvent pas se connecter entre eux. Ce partage
          fonctionne entre deux iPhones ou deux Android.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f9f9f9', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  subtitle: { color: '#666', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#e6e6e6', marginHorizontal: 12 },
  section: { fontSize: 13, fontWeight: '600', color: '#666', marginTop: 24, marginBottom: 8, textTransform: 'uppercase' },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },
  statusText: { color: '#333', flex: 1 },
  list: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  peerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6e6e6',
  },
  peerName: { fontSize: 15, fontWeight: '600' },
  peerId: { fontSize: 11, color: '#888', fontFamily: 'monospace' },
  peerAction: { color: '#2196f3', fontWeight: '600' },
  connectedBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  connectedName: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  note: { color: '#888', fontSize: 11, marginTop: 24, textAlign: 'center', fontStyle: 'italic' },
});
