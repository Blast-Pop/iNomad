// High-level wrapper around expo-nearby-connections that exposes a tiny
// event-emitter API tailored to iNomad's exchange flow (advertise + scan
// symmetrically, then either side can initiate a connection and send spots).

import {
  startAdvertise,
  stopAdvertise,
  startDiscovery,
  stopDiscovery,
  requestConnection,
  acceptConnection,
  rejectConnection,
  disconnect,
  sendText,
  onPeerFound,
  onPeerLost,
  onInvitationReceived,
  onConnected,
  onDisconnected,
  onTextReceived,
  Strategy,
} from 'expo-nearby-connections';

class EventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event].add(cb);
    return () => this.listeners[event]?.delete(cb);
  }
  emit(event, payload) {
    this.listeners[event]?.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.warn(`[nearbyService] listener for ${event} threw`, e);
      }
    });
  }
}

const STRATEGY = Strategy.P2P_CLUSTER;

class NearbyService extends EventEmitter {
  constructor() {
    super();
    this.advertising = false;
    this.discovering = false;
    this.peers = new Map();
    this.connected = new Set();
    this.subs = [];
    this.bound = false;
  }

  _bindOnce() {
    if (this.bound) return;
    this.bound = true;
    this.subs.push(
      onPeerFound(({ peerId, name }) => {
        this.peers.set(peerId, { peerId, name });
        this.emit('peerFound', { peerId, name });
      })
    );
    this.subs.push(
      onPeerLost(({ peerId }) => {
        this.peers.delete(peerId);
        this.emit('peerLost', { peerId });
      })
    );
    this.subs.push(
      onInvitationReceived(({ peerId, name }) => {
        this.emit('invitation', { peerId, name });
      })
    );
    this.subs.push(
      onConnected(({ peerId, name }) => {
        this.connected.add(peerId);
        this.emit('connected', { peerId, name });
      })
    );
    this.subs.push(
      onDisconnected(({ peerId }) => {
        this.connected.delete(peerId);
        this.emit('disconnected', { peerId });
      })
    );
    this.subs.push(
      onTextReceived(({ peerId, text }) => {
        this.emit('text', { peerId, text });
      })
    );
  }

  async startAdvertise(name) {
    this._bindOnce();
    if (this.advertising) return;
    await startAdvertise(name, STRATEGY);
    this.advertising = true;
    this.emit('state', this.snapshot());
  }

  async stopAdvertise() {
    if (!this.advertising) return;
    await stopAdvertise();
    this.advertising = false;
    this.emit('state', this.snapshot());
  }

  async startDiscovery(name) {
    this._bindOnce();
    if (this.discovering) return;
    await startDiscovery(name, STRATEGY);
    this.discovering = true;
    this.emit('state', this.snapshot());
  }

  async stopDiscovery() {
    if (!this.discovering) return;
    await stopDiscovery();
    this.discovering = false;
    this.emit('state', this.snapshot());
  }

  async stopAll() {
    await this.stopAdvertise().catch(() => {});
    await this.stopDiscovery().catch(() => {});
    await disconnect().catch(() => {});
    this.peers.clear();
    this.connected.clear();
    this.emit('state', this.snapshot());
  }

  async invite(peerId) {
    await requestConnection(peerId);
  }

  async accept(peerId) {
    await acceptConnection(peerId);
  }

  async reject(peerId) {
    await rejectConnection(peerId);
  }

  async sendTo(peerId, text) {
    await sendText(peerId, text);
  }

  snapshot() {
    return {
      advertising: this.advertising,
      discovering: this.discovering,
      peers: Array.from(this.peers.values()),
      connected: Array.from(this.connected),
    };
  }
}

export const nearbyService = new NearbyService();
