// In-app update checker for sideload-distributed releases.
// Polls the GitHub Releases API, compares semver, downloads the APK, and
// hands it to Android's package installer via an intent. iOS is a no-op
// since sideload updates aren't possible outside the App Store / TestFlight.

import { Platform } from 'react-native';
import * as Application from 'expo-application';
// Use the legacy filesystem API (createDownloadResumable, getContentUriAsync).
// The new SDK 55 File/Directory classes don't yet have a content-URI helper for
// handing files to native intents, and the legacy module remains shipped.
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

const REPO_OWNER = 'Blast-Pop';
const REPO_NAME = 'iNomad';
const LATEST_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

function parseSemver(v) {
  return String(v || '0.0.0')
    .replace(/^v/, '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
}

function isNewer(latest, current) {
  const a = parseSemver(latest);
  const b = parseSemver(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ai = a[i] || 0;
    const bi = b[i] || 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return false;
}

export async function checkForUpdate() {
  if (Platform.OS !== 'android') return null;
  try {
    const response = await fetch(LATEST_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return null;
    const release = await response.json();
    const latestVersion = (release.tag_name || '').replace(/^v/, '');
    const currentVersion = Application.nativeApplicationVersion || '0.0.0';
    if (!isNewer(latestVersion, currentVersion)) return null;
    const apkAsset = release.assets?.find((a) => a.name?.endsWith('.apk'));
    if (!apkAsset) return null;
    return {
      version: latestVersion,
      currentVersion,
      url: apkAsset.browser_download_url,
      sizeBytes: apkAsset.size,
      notes: release.body || '',
      htmlUrl: release.html_url,
    };
  } catch {
    return null;
  }
}

export async function downloadAndInstall(update, onProgress) {
  if (Platform.OS !== 'android') {
    throw new Error('In-app updates only supported on Android.');
  }
  const dest = FileSystem.cacheDirectory + 'inomad-update.apk';
  try {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  } catch {}
  const callback = onProgress
    ? ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        const pct = totalBytesExpectedToWrite
          ? totalBytesWritten / totalBytesExpectedToWrite
          : 0;
        onProgress(pct);
      }
    : undefined;
  const downloadResumable = FileSystem.createDownloadResumable(
    update.url,
    dest,
    {},
    callback
  );
  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) throw new Error('Téléchargement échoué.');
  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  // ACTION_VIEW with a content:// URI lets Android route to the package installer.
  // FLAG_GRANT_READ_URI_PERMISSION (=1) gives the installer access to the file.
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1,
    type: 'application/vnd.android.package-archive',
  });
}
