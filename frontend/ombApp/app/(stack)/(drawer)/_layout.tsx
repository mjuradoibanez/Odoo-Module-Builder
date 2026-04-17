import CustomDrawer from '@/components/shared/CustomDrawer';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

const DrawerLayout = () => {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.light.background },
        headerTitleStyle: { color: Colors.light.primary, fontFamily: 'Montserrat-Bold' },
        headerTintColor: Colors.light.primary,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'dashboard';
          let title = 'Módulos';
          if (routeName === 'dashboard') {
            title = 'Inicio';
          } else if (routeName === 'module-editor') {
            title = 'Módulos';
          } else if (routeName === 'model-editor') {
            title = 'Nuevo Módulo';
          } else if (routeName === 'deploy') {
            title = 'Desplegar';
          } else if (routeName === 'settings') {
            title = 'Settings';
          } else if (routeName === 'profile') {
            title = 'Profile';
          } else if (routeName === 'about') {
            title = 'About';
          }
          return {
            title,
            drawerLabel: title,
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          };
        }}
      />
    </Drawer>
  );
};

export default DrawerLayout;