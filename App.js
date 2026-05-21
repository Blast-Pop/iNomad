import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigation from './components/AppNavigation';
import OnboardingScreen from './screen/OnboardingScreen';
import UpdateModal from './components/UpdateModal';
import { getOrCreateIdentity } from './lib/identity';
import { IdentityContext } from './lib/identityContext';
import { checkForUpdate } from './lib/updater';

export default function App() {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(null);

  useEffect(() => {
    (async () => {
      const ident = await getOrCreateIdentity();
      setIdentity(ident);
      setLoading(false);
    })();
  }, []);

  // Check for new GitHub release in the background after the app is up.
  // Non-blocking — failures are silent (no network, rate limit, etc.).
  useEffect(() => {
    if (loading) return;
    const id = setTimeout(() => {
      checkForUpdate().then((u) => {
        if (u) setUpdate(u);
      });
    }, 1500);
    return () => clearTimeout(id);
  }, [loading]);

  let content;
  if (loading) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  } else if (!identity.pseudo) {
    content = <OnboardingScreen identity={identity} onDone={setIdentity} />;
  } else {
    content = (
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <IdentityContext.Provider value={{ identity, setIdentity }}>
        {content}
        {update && <UpdateModal update={update} onClose={() => setUpdate(null)} />}
      </IdentityContext.Provider>
    </GestureHandlerRootView>
  );
}
