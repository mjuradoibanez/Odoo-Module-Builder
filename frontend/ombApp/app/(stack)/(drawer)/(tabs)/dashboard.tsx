import React from 'react';
import { View, Text, useWindowDimensions, FlatList, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useUserModules } from '@/presentation/hooks/useUserModules';
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

  const { modules, isLoading, reload } = useUserModules(userId);

  return (
    <View style={[{ flex: 1, padding: 16 }, isDesktop && { paddingLeft: 80, backgroundColor: Colors.light.background }]}> 
      <Text
        style={[
          { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: Colors.light.primary },
          isDesktop && { marginLeft: 32 }
        ]}
      >
        Tus módulos
      </Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.light.primary} />
      ) : modules.length === 0 ? (
        <Text style={{ color: Colors.light.icon }}>No tienes módulos creados todavía.</Text>
      ) : (
        <FlatList
          data={modules}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <ModuleCard module={item} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
};

export default DashboardScreen;