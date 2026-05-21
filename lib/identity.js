// Local-only cryptographic identity for iNomad peers.
//
// Each install generates a long-lived ed25519 keypair stored in SecureStore.
// The public key fingerprint becomes the user's peerId — short, human-friendly,
// and stable across launches. Used to sign spots shared P2P (Phase 3) so peers
// can verify authenticity without any central authority.

import 'react-native-get-random-values';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { sha256 } from '@noble/hashes/sha256';
import * as SecureStore from 'expo-secure-store';

ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
ed.etc.sha512Async = (...m) => Promise.resolve(ed.etc.sha512Sync(...m));

const KEY_SECRET = 'inomad.identity.secretKey';
const KEY_PUBLIC = 'inomad.identity.publicKey';
const KEY_PSEUDO = 'inomad.identity.pseudo';

const BASE64URL_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function bytesToHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToBase64Url(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    out += BASE64URL_ALPHABET[a >> 2];
    out += BASE64URL_ALPHABET[((a & 3) << 4) | (b >> 4)];
    if (i + 1 < bytes.length) out += BASE64URL_ALPHABET[((b & 15) << 2) | (c >> 6)];
    if (i + 2 < bytes.length) out += BASE64URL_ALPHABET[c & 63];
  }
  return out;
}

export function peerIdFromPublicKey(publicKey) {
  // 12-char base64url of SHA-256(publicKey). Short enough to display, long
  // enough that an unconfigured collision is astronomically unlikely.
  return bytesToBase64Url(sha256(publicKey)).slice(0, 12);
}

async function generateKeypair() {
  const secretKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(secretKey);
  return { secretKey, publicKey };
}

export async function getIdentity() {
  const secretHex = await SecureStore.getItemAsync(KEY_SECRET);
  if (!secretHex) return null;
  const publicHex = await SecureStore.getItemAsync(KEY_PUBLIC);
  const pseudo = await SecureStore.getItemAsync(KEY_PSEUDO);
  const publicKey = hexToBytes(publicHex);
  return {
    secretKey: hexToBytes(secretHex),
    publicKey,
    peerId: peerIdFromPublicKey(publicKey),
    pseudo,
  };
}

export async function getOrCreateIdentity() {
  const existing = await getIdentity();
  if (existing) return existing;
  const { secretKey, publicKey } = await generateKeypair();
  await SecureStore.setItemAsync(KEY_SECRET, bytesToHex(secretKey));
  await SecureStore.setItemAsync(KEY_PUBLIC, bytesToHex(publicKey));
  return {
    secretKey,
    publicKey,
    peerId: peerIdFromPublicKey(publicKey),
    pseudo: null,
  };
}

export async function setPseudo(pseudo) {
  await SecureStore.setItemAsync(KEY_PSEUDO, pseudo);
}

export async function resetIdentity() {
  await SecureStore.deleteItemAsync(KEY_SECRET);
  await SecureStore.deleteItemAsync(KEY_PUBLIC);
  await SecureStore.deleteItemAsync(KEY_PSEUDO);
}

// Sign / verify helpers for Phase 3 spot exchange.
export async function signSpotPayload(payloadBytes, secretKey) {
  return await ed.signAsync(payloadBytes, secretKey);
}

export async function verifySpotSignature(signature, payloadBytes, publicKey) {
  try {
    return await ed.verifyAsync(signature, payloadBytes, publicKey);
  } catch {
    return false;
  }
}
