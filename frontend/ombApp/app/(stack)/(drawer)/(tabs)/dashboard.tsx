import React from 'react';
import { View, Text, useWindowDimensions, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useUserModules } from '@/presentation/hooks/useUserModules';
import { usePublicModules } from '@/presentation/hooks/usePublicModules';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { Colors } from '@/constants/theme';

const DashboardScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const user = useAuthStore(state => state.user);
  const userId = user?.id;

  // Si no hay userId, mostrar loader o null
  if (!userId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const { modules: myModules, isLoading: isLoadingMy, reload } = useUserModules(userId);
  const { modules: publicModules, isLoading: isLoadingPublic } = usePublicModules();

  return (
    <View style={[{ flex: 1, padding: 16 }, isDesktop && { paddingLeft: 80, backgroundColor: Colors.light.background }]}> 
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: Colors.light.primary }}>
        Tus módulos públicos
      </Text>
      {isLoadingMy ? (
        <ActivityIndicator size="large" color={Colors.light.primary} />
      ) : myModules.filter(m => m.isPublic).length === 0 ? (
        <Text style={{ color: Colors.light.icon }}>No tienes módulos públicos creados todavía.</Text>
      ) : (
        <FlatList
          data={myModules.filter(m => m.isPublic)}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                router.push({ pathname: '/module-editor', params: { id: item.id } });
              }}
              activeOpacity={0.8}
            >
            <ModuleCard module={item} showLock={false} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 32, marginBottom: 16, color: Colors.light.accent }}>
        Módulos públicos de la comunidad
      </Text>
      {isLoadingPublic ? (
        <ActivityIndicator size="large" color={Colors.light.primary} />
      ) : publicModules.filter(m => m.user.id !== userId).length === 0 ? (
        <Text style={{ color: Colors.light.icon }}>No hay módulos públicos de otros usuarios disponibles.</Text>
      ) : (
        <FlatList
          data={publicModules.filter(m => m.user.id !== userId)}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                router.push({ pathname: '/module-editor', params: { id: item.id } });
              }}
              activeOpacity={0.8}
            >
            <ModuleCard module={item} showLock={false} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
};

export default DashboardScreen;