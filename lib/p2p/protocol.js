// Wire protocol for P2P spot exchange.
//
// Messages are UTF-8 JSON envelopes sent via expo-nearby-connections.sendText.
// Each spot bundle carries a signature over the canonical payload so receivers
// can verify the sender's identity claim against their advertised pseudo.

import { signSpotPayload, verifySpotSignature } from '../identity';

export const MSG_TYPE = {
  HELLO: 'hello',
  SPOTS: 'spots',
  ACK: 'ack',
};

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

function utf8Bytes(str) {
  // RN's TextEncoder is available with new arch + Hermes; fall back if not.
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const out = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return new Uint8Array(out);
}

function canonicalize(spots) {
  // Sort by id so signatures are stable regardless of array order.
  const sorted = [...spots].sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(
    sorted.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      activity: s.activity,
      latitude: s.latitude,
      longitude: s.longitude,
      createdAt: s.createdAt,
      author: s.author,
    }))
  );
}

export async function buildSpotsMessage(identity, spots) {
  const canonical = canonicalize(spots);
  const signature = await signSpotPayload(utf8Bytes(canonical), identity.secretKey);
  return JSON.stringify({
    type: MSG_TYPE.SPOTS,
    from: {
      peerId: identity.peerId,
      pseudo: identity.pseudo,
      publicKey: bytesToHex(identity.publicKey),
    },
    spots: JSON.parse(canonical),
    signature: bytesToHex(signature),
    sentAt: new Date().toISOString(),
  });
}

export function buildHelloMessage(identity) {
  return JSON.stringify({
    type: MSG_TYPE.HELLO,
    from: {
      peerId: identity.peerId,
      pseudo: identity.pseudo,
    },
  });
}

export function buildAckMessage(receivedCount) {
  return JSON.stringify({ type: MSG_TYPE.ACK, receivedCount });
}

export function parseMessage(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function verifySpotsMessage(msg) {
  if (msg?.type !== MSG_TYPE.SPOTS) return false;
  if (!msg.from?.publicKey || !msg.signature) return false;
  const canonical = canonicalize(msg.spots || []);
  return await verifySpotSignature(
    hexToBytes(msg.signature),
    utf8Bytes(canonical),
    hexToBytes(msg.from.publicKey)
  );
}
