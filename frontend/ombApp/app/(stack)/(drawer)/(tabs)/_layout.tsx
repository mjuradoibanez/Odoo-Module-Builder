import { CustomTabBar } from '@/components/shared/CustomTabBar';
import { AppColors, AppFonts } from '@/styles/appTheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

const TabsLayout = () => {
  const primary = AppColors.primary;
  const bg = AppColors.background;
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
          tabBarLabel: 'Módulos',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name="apps-outline" color={focused ? AppColors.accent : color} style={focused ? { backgroundColor: AppColors.primary, borderRadius: 8, padding: 4 } : {}} />
        }}
      />
      <Tabs.Screen
        name='module-editor'
        options={{
          tabBarLabel: 'Editor Módulo',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name="build-outline" color={focused ? AppColors.accent : color} style={focused ? { backgroundColor: AppColors.primary, borderRadius: 8, padding: 4 } : {}} />
        }}
      />
      <Tabs.Screen
        name='model-editor'
        options={{
          tabBarLabel: 'Modelos',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name="layers-outline" color={focused ? AppColors.accent : color} style={focused ? { backgroundColor: AppColors.primary, borderRadius: 8, padding: 4 } : {}} />
        }}
      />
      <Tabs.Screen
        name='deploy'
        options={{
          tabBarLabel: 'Desplegar',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name="cloud-upload-outline" color={focused ? AppColors.accent : color} style={focused ? { backgroundColor: AppColors.primary, borderRadius: 8, padding: 4 } : {}} />
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