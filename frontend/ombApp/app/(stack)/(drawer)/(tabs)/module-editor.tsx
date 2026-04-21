import React, { useState } from 'react';
import { View, useWindowDimensions, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { ModuleDetail } from '@/components/shared/ModuleDetail';
import { useUserModules } from '@/presentation/hooks/useUserModules';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useLocalSearchParams, router } from 'expo-router';

const ModuleEditorScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const user = useAuthStore(state => state.user);
  const userId = user?.id;
  const { id } = useLocalSearchParams();
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(id ? Number(id) : null);
  if (!userId) {
    return null;
  }
  const { modules, isLoading } = useUserModules(userId);

  // Si hay un id en la ruta, mostrar ese módulo aunque no sea del usuario
  const showExternalModule = id && (!modules.some(m => m.id === Number(id)));

  // Si seleccionas uno de tus módulos, actualiza la URL para reflejar el id
  const handleSelectModule = (moduleId: number) => {
    if (Number(id) === moduleId) {
      // Si ya está seleccionado, lo deselecciona (cierra el detalle)
      router.replace({ pathname: '/module-editor' });
    } else {
      setSelectedModuleId(moduleId);
      if (isDesktop) {
        router.replace({ pathname: '/module-editor', params: { id: moduleId } });
      }
    }
  };

  if (isDesktop) {
    const showDetail = !!id;
    return (
      <View style={[{ flex: 1, flexDirection: 'row' }, { paddingLeft: 80, backgroundColor: '#F7F7F7' }]}> 
        {/* Lista de módulos del usuario */}
        <View style={{ flex: showDetail ? 0.32 : 1, padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: Colors.light.primary }}>
            Todos tus módulos
          </Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.light.primary} />
          ) : modules.length === 0 ? (
            <Text style={{ color: Colors.light.icon }}>No tienes módulos creados todavía.</Text>
          ) : (
            <FlatList
              data={modules}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectModule(item.id)}
                  activeOpacity={0.8}
                  style={{ position: 'relative' }}
                >
                  <ModuleCard module={item} selected={isDesktop && Number(id) === item.id} showLock />
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          )}
        </View>
        {/* Detalles del módulo seleccionado o externo */}
        {showDetail && (
          <View style={{ flex: 0.68, padding: 16, borderLeftWidth: 1, borderLeftColor: Colors.light.border }}>
            <ModuleDetail moduleId={Number(id)} />
          </View>
        )}
      </View>
    );
  } else {
    // Móvil: de la lista pasa al editor
    if (selectedModuleId !== null) {
      return (
        <View style={{ flex: 1, padding: 16, backgroundColor: '#F7F7F7' }}>
          <ModuleDetail moduleId={selectedModuleId as number} />
        </View>
      );
    }
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: '#F7F7F7' }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: Colors.light.primary }}>
          Todos tus módulos
        </Text>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} />
        ) : modules.length === 0 ? (
          <Text style={{ color: Colors.light.icon }}>No tienes módulos creados todavía.</Text>
        ) : (
          <FlatList
            data={modules}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedModuleId(item.id)}
                activeOpacity={0.8}
                style={{ position: 'relative' }}
              >
                <ModuleCard module={item} />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )}
      </View>
    );
  }
};

export default ModuleEditorScreen;