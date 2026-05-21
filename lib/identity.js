// Device-bound cryptographic identity for iNomad peers.
//
// The ed25519 keypair is derived deterministically from a stable per-device
// identifier (Settings.Secure.ANDROID_ID on Android, identifierForVendor on
// iOS) mixed with an app-specific salt. Same phone -> same peerId, even after
// uninstall + reinstall. The derived secret key is also cached in SecureStore
// so the device ID is only consulted when missing.
//
// Tradeoff: an attacker with root + ANDROID_ID can reconstruct the key. For an
// outdoor spots app the upside (persistent identity, no account recovery
// problem) outweighs the marginal security loss.

import 'react-native-get-random-values';
import { Platform } from 'react-native';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { sha256 } from '@noble/hashes/sha256';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';

ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
ed.etc.sha512Async = (...m) => Promise.resolve(ed.etc.sha512Sync(...m));

const KEY_SECRET = 'inomad.identity.secretKey';
const KEY_PUBLIC = 'inomad.identity.publicKey';
const KEY_PSEUDO = 'inomad.identity.pseudo';

const IDENTITY_SALT = 'inomad.identity.v1';

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

function utf8Bytes(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
  const out = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return new Uint8Array(out);
}

export function peerIdFromPublicKey(publicKey) {
  return bytesToBase64Url(sha256(publicKey)).slice(0, 12);
}

async function getDeviceIdentifier() {
  try {
    if (Platform.OS === 'android') {
      const id = Application.getAndroidId();
      if (id && id !== '9774d56d682e549c') return id;
    } else if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync();
      if (id) return id;
    }
  } catch {
    // fall through to random
  }
  return null;
}

async function deriveSecretKey() {
  const deviceId = await getDeviceIdentifier();
  if (deviceId) {
    // SHA-256 -> exactly 32 bytes, which is the ed25519 seed size.
    return sha256(utf8Bytes(`${IDENTITY_SALT}:${deviceId}`));
  }
  // No device id (web, broken emulator, etc.) -> random key
  return ed.utils.randomPrivateKey();
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
  const secretKey = await deriveSecretKey();
  const publicKey = await ed.getPublicKeyAsync(secretKey);
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

// Clears the pseudo only — keypair (and therefore peerId) is bound to this
// device and stays the same across pseudo changes.
export async function clearPseudo() {
  await SecureStore.deleteItemAsync(KEY_PSEUDO);
}

// Sign / verify helpers for P2P spot exchange.
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
