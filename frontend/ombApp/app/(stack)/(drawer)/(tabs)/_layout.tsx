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
        headerShown: true,
        headerStyle: { backgroundColor: bg },
        headerTitleStyle: { color: primary, fontFamily: font },
        headerTintColor: primary,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name='dashboard'
        options={{
          tabBarLabel: 'Módulos',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="grid-outline" color={color} />
        }}
      />
      <Tabs.Screen
        name='module-editor'
        options={{
          tabBarLabel: 'Editor Módulo',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="construct-outline" color={color} />
        }}
      />
      <Tabs.Screen
        name='model-editor'
        options={{
          tabBarLabel: 'Editor Modelo',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="cube-outline" color={color} />
        }}
      />
      <Tabs.Screen
        name='deploy'
        options={{
          tabBarLabel: 'Deploy',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="cloud-upload-outline" color={color} />
        }}
      />
    </Tabs>
  )
}

export default TabsLayout