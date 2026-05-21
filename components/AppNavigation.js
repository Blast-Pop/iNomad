import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screen/MapScreen';
import ProfileScreen from '../screen/ProfileScreen';
import ExchangeScreen from '../screen/ExchangeScreen';
import { colors, spacing, radius } from '../lib/theme';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <View style={styles.drawer}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerLogo}>
          <Ionicons name="compass" size={28} color={colors.accent} />
        </View>
        <Text style={styles.drawerBrand}>iNomad</Text>
        <Text style={styles.drawerTagline}>Open-source · offline · P2P</Text>
      </View>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={styles.drawerFooter}>
        <Text style={styles.drawerFooterText}>MIT · @therealblastpop</Text>
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
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        sceneContainerStyle: { backgroundColor: colors.bg },
        drawerStyle: { backgroundColor: colors.bgElevated, width: 280 },
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.textMuted,
        drawerActiveBackgroundColor: colors.surfaceMuted,
        drawerLabelStyle: { fontSize: 15, fontWeight: '500', marginLeft: -8 },
        drawerItemStyle: { borderRadius: radius.md, marginHorizontal: spacing.sm },
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

const styles = StyleSheet.create({
  drawer: { flex: 1, backgroundColor: colors.bgElevated },
  drawerHeader: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + 12,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    alignItems: 'center',
  },
  drawerLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  drawerBrand: { color: colors.text, fontSize: 20, fontWeight: '800' },
  drawerTagline: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  drawerFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    alignItems: 'center',
  },
  drawerFooterText: { color: colors.textDim, fontSize: 11 },
});
