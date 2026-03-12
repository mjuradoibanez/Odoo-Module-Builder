import { PRIMARY } from '@/styles/colors';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Cargar fuentes personalizadas al iniciar la app
  useEffect(() => {
    Font.loadAsync({
      'Montserrat-Bold': require('@/assets/fonts/Montserrat-Bold.ttf'),
      'Montserrat-Regular': require('@/assets/fonts/Montserrat-Regular.ttf'),
      'Montserrat-Light': require('@/assets/fonts/Montserrat-Light.ttf'),
    }).then(() => setFontsLoaded(true));
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
