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
          <View style={{ marginHorizontal: 30 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: Colors.light.primary }}>
              Todos tus módulos
            </Text>
          </View>
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
            {/* Detalle del módulo */}
            <ModuleDetail moduleId={Number(id)} />
            {/* Botón Editar modelos solo si el módulo es del usuario */}
            {modules.some(m => m.id === Number(id) && m.user?.id === userId) && (
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 32, alignItems: 'center' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: Colors.light.primary,
                    paddingVertical: 18,
                    paddingHorizontal: 40,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                  onPress={() => router.push({ pathname: '/model-editor', params: { moduleId: id } })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="construct" size={24} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Editar modelos</Text>
                </TouchableOpacity>
              </View>
            )}
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
        <View style={{ marginHorizontal: 30 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: Colors.light.primary }}>
            Todos tus módulos
          </Text>
        </View>
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