import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  requestMultiple,
} from 'react-native-permissions';

const ANDROID_PERMS = [
  PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
  PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
  PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
  PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES,
];

const IOS_PERMS = [PERMISSIONS.IOS.BLUETOOTH, PERMISSIONS.IOS.LOCAL_NETWORK];

function permsForPlatform() {
  return Platform.OS === 'ios' ? IOS_PERMS : ANDROID_PERMS;
}

function allGranted(statuses) {
  return Object.values(statuses).every(
    (s) => s === RESULTS.GRANTED || s === RESULTS.LIMITED
  );
}

export async function ensureP2pPermissions() {
  const perms = permsForPlatform();
  const current = await checkMultiple(perms);
  if (allGranted(current)) return { granted: true, statuses: current };
  const requested = await requestMultiple(perms);
  return { granted: allGranted(requested), statuses: requested };
}
