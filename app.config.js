// Expo app config — values are loaded from .env at build/start time.
// Copy .env.example to .env and fill in your own values.
// See https://docs.expo.dev/guides/environment-variables/

module.exports = () => ({
  expo: {
    name: 'iNomad',
    slug: 'iNomad',
    version: '0.2.0',
    orientation: 'portrait',
    icon: './assets/logo.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.blastpop.iNomad',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      },
      infoPlist: {
        NSBluetoothAlwaysUsageDescription:
          'iNomad utilise Bluetooth pour partager des spots avec des téléphones à proximité.',
        NSLocalNetworkUsageDescription:
          'iNomad utilise le réseau local pour découvrir les téléphones à proximité.',
      },
    },
    android: {
      package: 'com.blastpop.iNomad',
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.BLUETOOTH_ADVERTISE',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.NEARBY_WIFI_DEVICES',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-location',
      'expo-secure-store',
      [
        'expo-nearby-connections',
        {
          bonjourServicesName: 'inomad',
          localNetworkUsagePermissionText:
            'iNomad utilise le réseau local pour découvrir les téléphones à proximité.',
          bluetoothUsagePermissionText:
            'iNomad utilise Bluetooth pour partager des spots avec des téléphones à proximité.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'e1afbee3-f38d-4c36-992d-7920574c3587',
      },
    },
    owner: 'blast-pop',
  },
});
