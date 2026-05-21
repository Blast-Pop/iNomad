<div align="center">
  <img src="assets/icon.png" alt="iNomad Logo" width="200"/>
  <h1>iNomad</h1>
  <p><i>A smart traveling app for fishing spots, trails and wild places.</i></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020.svg?logo=expo)](https://expo.dev)
  [![Offline-first](https://img.shields.io/badge/Offline-first-2ea44f.svg)](#)
  [![P2P](https://img.shields.io/badge/Sharing-P2P-9b59b6.svg)](#)
</div>

---

## 🌍 What is iNomad?

**iNomad** is a mobile application built for adventurers, nature lovers, and explorers.
It helps users **save and share outdoor locations** like:

- Fishing spots 🎣
- ATV and off-road trails 🛻
- Remote campsites ⛺
- Hidden gems and cool places 🧭

---

## ✨ Key Features

- 📍 Add spots with GPS coordinates and activity tags
- 🗺️ Interactive map with navigation hand-off to Google Maps
- 📶 100% offline-first — your spots live on your phone
- 🔒 No accounts, no servers — local-only ed25519 identity
- 📡 **Peer-to-peer sharing by proximity** — AirDrop-style spot exchange via
  Google Nearby Connections (Android) and Apple MultipeerConnectivity (iOS)
- ✍️ Spots are signed with your keypair so recipients can verify authenticity

---

## 🚧 Project Status

**v0.2.0 — standalone + open-source pivot.** No more cloud backend. The exchange
feature works between two Androids or between two iOSes (cross-platform iOS ↔
Android is not supported by the underlying APIs).

---

## 📦 Tech Stack

- React Native + Expo (SDK 55)
- `react-native-maps` for the map
- `expo-secure-store` + `@noble/ed25519` for local cryptographic identity
- `expo-nearby-connections` for peer-to-peer transport
- `react-native-permissions` for Bluetooth / Local Network prompts
- React Navigation (drawer)
- AsyncStorage for spot persistence

---

## 🛠️ Running the App Locally

> The Nearby Connections native module is not available in Expo Go. You need a
> development build (one-time setup via EAS).

```bash
git clone https://github.com/Blast-Pop/iNomad.git
cd iNomad
cp .env.example .env       # then fill in GOOGLE_MAPS_API_KEY
npm install
```

Get a Google Maps API key (free tier is fine for dev) at
[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
Restrict it to `com.blastpop.iNomad` + your SHA-1.

### Build a development client (one time)

```bash
npx expo prebuild --clean         # generates android/ + ios/
npx eas-cli login                 # if you haven't already
npx eas-cli build --profile development --platform android
```

Install the resulting APK on your phone. From then on:

```bash
npx expo start --dev-client
```

### Build a release APK

```bash
npx eas-cli build --profile preview --platform android
```

---

## 📲 How peer-to-peer exchange works

1. Open the **Échanger** tab on both phones.
2. Phone A turns on **Be visible** (advertises).
3. Phone B turns on **Find peers** (scans). Phone A appears in the list.
4. Phone B taps Phone A's row — Phone A receives an invitation and accepts.
5. Either side hits **Send my spots**. The bundle is signed with the sender's
   ed25519 key. The receiver previews + accepts, and the spots land on the map
   with a star pin and a "received from @pseudo" badge.

No servers, no accounts, no data ever leaves the local Bluetooth / WiFi range.

---

## 📄 License

[MIT](LICENSE) — free to use, modify, distribute, including commercially.

---

## 🙌 Contributing

Issues and PRs welcome. The codebase is small and hackable. Releases live on
the [Releases page](https://github.com/Blast-Pop/iNomad/releases).
