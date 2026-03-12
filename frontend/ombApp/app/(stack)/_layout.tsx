import { Redirect, Slot } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';

export default function AppLayout() {

  const { status, checkStatus } = useAuthStore();

  useEffect(() => {
    checkStatus();
  }, []);

  // loader mientras comprueba la autenticacion
  if (status === 'checking') {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/auth/login" />;
  }

  return <Slot />;
}
