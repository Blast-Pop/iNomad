import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigation } from '@react-navigation/native';

export default function LogoutScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();

      // Redirige vers l'écran d'accueil (AuthScreen)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    };

    logout();
  }, []);

  return null;
}
