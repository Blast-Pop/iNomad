import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigation from './components/AppNavigation';
import OnboardingScreen from './screen/OnboardingScreen';
import UpdateModal from './components/UpdateModal';
import { getOrCreateIdentity } from './lib/identity';
import { IdentityContext } from './lib/identityContext';
import { checkForUpdate } from './lib/updater';
import { colors } from './lib/theme';

const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.borderSubtle,
    primary: colors.accent,
    notification: colors.accent,
  },
};

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  } else if (!identity.pseudo) {
    content = <OnboardingScreen identity={identity} onDone={setIdentity} />;
  } else {
    content = (
      <NavigationContainer theme={NavTheme}>
        <AppNavigation />
      </NavigationContainer>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <IdentityContext.Provider value={{ identity, setIdentity }}>
        {content}
        {update && <UpdateModal update={update} onClose={() => setUpdate(null)} />}
      </IdentityContext.Provider>
    </GestureHandlerRootView>
  );
}
