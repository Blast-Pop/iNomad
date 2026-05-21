import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigation from './components/AppNavigation';
import OnboardingScreen from './screen/OnboardingScreen';
import { getOrCreateIdentity } from './lib/identity';
import { IdentityContext } from './lib/identityContext';

export default function App() {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const ident = await getOrCreateIdentity();
      setIdentity(ident);
      setLoading(false);
    })();
  }, []);

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
      </IdentityContext.Provider>
    </GestureHandlerRootView>
  );
}
