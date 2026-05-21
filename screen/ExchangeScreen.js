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
import { colors, spacing, radius, shadow } from '../lib/theme';

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
      if (!granted) setStatusLine('Permissions Bluetooth requises');
    })();
  }, []);

  useEffect(() => {
    const offs = [
      nearbyService.on('state', setState),
      nearbyService.on('peerFound', ({ name }) => setStatusLine(`Trouvé: ${name}`)),
      nearbyService.on('peerLost', () => setState(nearbyService.snapshot())),
      nearbyService.on('invitation', ({ peerId, name }) => {
        Alert.alert('Invitation reçue', `${name} veut se connecter`, [
          { text: 'Refuser', style: 'cancel', onPress: () => nearbyService.reject(peerId) },
          { text: 'Accepter', onPress: () => nearbyService.accept(peerId) },
        ]);
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
            Alert.alert('Signature invalide', 'Spots rejetés.');
            return;
          }
          Alert.alert(
            `${msg.spots.length} spot(s) de ${msg.from?.pseudo || msg.from?.peerId}`,
            'Importer ces spots dans ta carte?',
            [
              { text: 'Refuser', style: 'cancel' },
              {
                text: 'Importer',
                onPress: async () => {
                  const result = await mergeReceivedSpots(msg.spots, msg.from);
                  setStatusLine(`${result.added} ajouté(s)`);
                  await nearbyService.sendTo(peerId, buildAckMessage(result.added));
                },
              },
            ]
          );
        } else if (msg.type === MSG_TYPE.ACK) {
          setStatusLine(`${msg.receivedCount} spot(s) importé(s) par le pair`);
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
      Alert.alert('Aucun spot', "Tu n'as pas encore de spots à partager.");
      return;
    }
    setBusy(true);
    try {
      const msg = await buildSpotsMessage(identity, spots);
      await nearbyService.sendTo(connectedPeer.peerId, msg);
      setStatusLine(`${spots.length} spot(s) envoyé(s)`);
    } catch (e) {
      Alert.alert('Erreur', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Ionicons name="bluetooth" size={36} color={colors.accent} />
        <Text style={styles.heroTitle}>Échanger</Text>
        <Text style={styles.heroSubtitle}>Partage par proximité, sans serveur</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleIcon}>
            <Ionicons name="radio" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Être visible</Text>
            <Text style={styles.toggleDesc}>Te rendre détectable par les autres téléphones</Text>
          </View>
          <Switch
            value={state.advertising}
            onValueChange={toggleVisible}
            disabled={busy}
            thumbColor={state.advertising ? colors.accent : colors.textDim}
            trackColor={{ true: colors.accentMuted, false: colors.border }}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleIcon}>
            <Ionicons name="search" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Chercher des pairs</Text>
            <Text style={styles.toggleDesc}>Scanner les autres téléphones iNomad</Text>
          </View>
          <Switch
            value={state.discovering}
            onValueChange={toggleSearch}
            disabled={busy}
            thumbColor={state.discovering ? colors.primary : colors.textDim}
            trackColor={{ true: colors.primaryDeep, false: colors.border }}
          />
        </View>
      </View>

      <View style={styles.statusBar}>
        {busy && <ActivityIndicator size="small" color={colors.accent} />}
        <Text style={styles.statusText}>{statusLine}</Text>
      </View>

      {state.peers.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Pairs détectés</Text>
          <View style={styles.list}>
            {state.peers.map((peer, idx) => {
              const isConnected = state.connected.includes(peer.peerId);
              return (
                <TouchableOpacity
                  key={peer.peerId}
                  style={[styles.peerRow, idx === state.peers.length - 1 && { borderBottomWidth: 0 }]}
                  disabled={isConnected || busy}
                  onPress={() => invite(peer)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={isConnected ? 'checkmark-circle' : 'phone-portrait-outline'}
                    size={22}
                    color={isConnected ? colors.success : colors.textMuted}
                  />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.peerName} numberOfLines={1}>{peer.name}</Text>
                    <Text style={styles.peerSub}>{peer.peerId.slice(0, 16)}…</Text>
                  </View>
                  <Text style={[styles.peerAction, isConnected && { color: colors.success }]}>
                    {isConnected ? 'Connecté' : 'Inviter'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {connectedPeer && (
        <View style={styles.connectedCard}>
          <View style={styles.connectedHeader}>
            <Ionicons name="link" size={20} color={colors.success} />
            <Text style={styles.connectedName}>{connectedPeer.name}</Text>
          </View>
          <TouchableOpacity style={styles.sendBtn} onPress={sendSpots} disabled={busy} activeOpacity={0.85}>
            <Ionicons name="paper-plane" size={18} color={colors.text} />
            <Text style={styles.sendBtnText}>Envoyer mes spots</Text>
          </TouchableOpacity>
        </View>
      )}

      {Platform.OS === 'ios' && (
        <Text style={styles.note}>
          Note: iOS ↔ Android non supporté. Marche entre 2 iOS ou 2 Android.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  heroSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },

  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadow.card,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  toggleDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle, marginHorizontal: spacing.md },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  statusText: { color: colors.textMuted, flex: 1, fontSize: 13 },

  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  list: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  peerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  peerName: { color: colors.text, fontWeight: '600', fontSize: 14 },
  peerSub: { color: colors.textDim, fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  peerAction: { color: colors.accent, fontWeight: '700', fontSize: 13 },

  connectedCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  connectedName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  sendBtnText: { color: colors.text, fontWeight: '700' },

  note: {
    color: colors.textDim,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
