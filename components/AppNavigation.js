import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MapScreen from '../screens/MapScreen';
import LogoutScreen from '../screens/LogoutScreen'; // à créer juste après
import { Ionicons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

export default function AppNavigation() {
  return (
    <Drawer.Navigator
      initialRouteName="Carte"
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: '#2196f3',
        drawerInactiveTintColor: 'gray',
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="Carte"
        component={MapScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Déconnexion"
        component={LogoutScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="exit-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
