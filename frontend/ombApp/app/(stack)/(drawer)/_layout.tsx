import CustomDrawer from '@/components/shared/CustomDrawer';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

const DrawerLayout = () => {
  // Estado del tema
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.primary, fontFamily: 'Montserrat-Bold' },
        headerTintColor: colors.primary,
      }}
    >
      {/* Personalizar etiqueta de la pestaña */}
      <Drawer.Screen
        name="(tabs)"
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'dashboard';
          let title = 'Módulos';
          if (routeName === 'dashboard') {
            title = 'Inicio';
          } else if (routeName === 'modules') {
            title = 'Módulos';
          } else if (routeName === 'module-editor') {
            title = 'Creación Módulos';
          } else if (routeName === 'deploy') {
            title = 'Desplegar';
          } else if (routeName === 'settings') {
            title = 'Ajustes';
          } else if (routeName === 'profile') {
            title = 'Perfil';
          } else if (routeName === 'about') {
            title = 'Acerca de';
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
