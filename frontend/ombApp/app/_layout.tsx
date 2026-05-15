import { PRIMARY } from '@/styles/colors';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const loadThemePreference = useThemeStore((state) => state.loadThemePreference);

  // Cargar fuentes personalizadas al iniciar la app
  useEffect(() => {
    Font.loadAsync({
      'Montserrat-Bold': require('@/assets/fonts/Montserrat-Bold.ttf'),
      'Montserrat-Regular': require('@/assets/fonts/Montserrat-Regular.ttf'),
      'Montserrat-Light': require('@/assets/fonts/Montserrat-Light.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  // Cargar preferencia de tema al iniciar
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Sincronizar el tema con el DOM para estilos CSS
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  // Establecer el título de la pestaña del navegador en web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'OMB - Odoo Module Builder';
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
