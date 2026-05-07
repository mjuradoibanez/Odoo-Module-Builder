import { CustomTabBar } from '@/components/shared/CustomTabBar';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { AppFonts } from '@/styles/appTheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

const TabsLayout = () => {
  // Obtener el estado del tema y los colores correspondientes
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);
  const font = AppFonts.bold;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name='dashboard'
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name="apps-outline" color={focused ? colors.accent : color} style={focused ? { backgroundColor: colors.primary, borderRadius: 8, padding: 4 } : {}} />
        }}
      />
      <Tabs.Screen
        name='modules'
        options={{
          tabBarLabel: 'Mis módulos',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name="build-outline" color={focused ? colors.accent : color} style={focused ? { backgroundColor: colors.primary, borderRadius: 8, padding: 4 } : {}} />
        }}
      />
      <Tabs.Screen
        name='module-editor'
        options={{
          tabBarLabel: 'Editor modelos',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name="layers-outline" color={focused ? colors.accent : color} style={focused ? { backgroundColor: colors.primary, borderRadius: 8, padding: 4 } : {}} />
        }}
      />
      <Tabs.Screen
        name='deploy'
        options={{
          tabBarLabel: 'Desplegar',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name="cloud-upload-outline" color={focused ? colors.accent : color} style={focused ? { backgroundColor: colors.primary, borderRadius: 8, padding: 4 } : {}} />
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name='about'
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  )
}

export default TabsLayout
