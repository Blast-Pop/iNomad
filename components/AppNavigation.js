import React from 'react';
import { View, Text } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screen/MapScreen';
import ProfileScreen from '../screen/ProfileScreen';
import ExchangeScreen from '../screen/ExchangeScreen';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
          iNomad — open-source, offline-first
        </Text>
      </View>
    </View>
  );
}

export default function AppNavigation() {
  return (
    <Drawer.Navigator
      initialRouteName="Carte"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
        name="Échanger"
        component={ExchangeScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bluetooth-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
