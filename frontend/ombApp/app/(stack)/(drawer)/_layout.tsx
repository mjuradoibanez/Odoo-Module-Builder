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

          if (routeName.includes('dashboard')) {
            title = 'Módulos';
          } else if (routeName.includes('module-editor')) {
            title = 'Editor de Módulo';
          } else if (routeName.includes('model-editor')) {
            title = 'Editor de Modelo';
          } else if (routeName.includes('deploy')) {
            title = 'Deploy';
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