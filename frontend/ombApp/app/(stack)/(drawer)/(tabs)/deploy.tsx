import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { useUserModules } from '@/presentation/hooks/useUserModules';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { Colors } from '@/constants/theme';
import { getModuleFull } from '@/core/actions/get-module-full';
import { useModuleFullStore } from '@/presentation/store/useModuleFullStore';
import { useGenerateAndDownloadModule } from '@/presentation/hooks/useGenerateAndDownloadModule';

// Pantalla de despliegue de módulo Odoo

// Validar si un módulo está completo: nombre técnico y al menos un modelo con campos
function isModuleComplete(module: any): boolean {
  if (!module.technicalName || !module.name || !Array.isArray(module.models) || module.models.length === 0) {
    return false;
  }
  for (const model of module.models) {
    if (!model.technicalName || !model.name || !Array.isArray(model.fields) || model.fields.length === 0) {
      return false;
    }
    for (const field of model.fields) {
      if (!field.technicalName || !field.name || !field.type) {
        return false;
      }
    }
  }
  return true;
}

const DeployScreen = () => {
  const user = useAuthStore(state => state.user);
  const userId = user?.id;
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const { modules, isLoading } = useUserModules(userId ?? 0);
  const moduleDetails = useModuleFullStore(state => state.moduleDetails);
  const setModuleDetail = useModuleFullStore(state => state.setModuleDetail);
  const setManyModuleDetails = useModuleFullStore(state => state.setManyModuleDetails);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const generateAndDownload = useGenerateAndDownloadModule();

  // Cargar detalles completos de los módulos para validar si están completos
  useEffect(() => {
    if (!modules || modules.length === 0) return;
    setLoadingDetails(true);
    const fetchMissingDetails = async () => {
      const details: Record<number, any> = {};
      await Promise.all(
        modules.map(async m => {
          if (moduleDetails[m.id]) {
            details[m.id] = moduleDetails[m.id];
            return;
          }
          try {
            const data = await getModuleFull(m.id);
            details[m.id] = data;
            setModuleDetail(m.id, data);
          } catch {
            details[m.id] = null;
          }
        })
      );
      setManyModuleDetails(details);
      setLoadingDetails(false);
    };
    fetchMissingDetails();
  }, [modules]);

  if (!userId) return null;

  return (
    <View style={[{ flex: 1, padding: 16, backgroundColor: Colors.light.background }, isDesktop && { paddingLeft: 80 }]}>
      <View style={{ marginHorizontal: 30 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 32, marginBottom: 16, color: Colors.light.primary }}>
          Desplegar módulo Odoo
        </Text>
      </View>
      {isLoading || loadingDetails ? (
        <ActivityIndicator size="large" color={Colors.light.primary} />
      ) : (
        <FlatList
          data={modules}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            const detail = moduleDetails[item.id];
            const complete = detail ? isModuleComplete(detail) : false;
            return (
              <TouchableOpacity
                onPress={() => complete && setSelectedModuleId(item.id)}
                activeOpacity={complete ? 0.8 : 1}
                style={{ opacity: complete ? 1 : 0.5 }}
                disabled={!complete}
              >
                <View style={selectedModuleId === item.id && complete ? styles.selectedCard : null}>
                  <ModuleCard module={item} showLock={false} incomplete={!!detail && !complete} />
                  {!detail && (
                    <Text style={styles.incompleteText}>Cargando...</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
      {selectedModuleId && isModuleComplete(moduleDetails[selectedModuleId]) && (
        <TouchableOpacity
          style={styles.deployButton}
          onPress={async () => {
            try {
              await generateAndDownload(moduleDetails[selectedModuleId]);
            } catch (e) {
              alert('Error al descargar el módulo');
            }
          }}
        >
          <Text style={styles.deployButtonText}>Descargar módulo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  incompleteText: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: 8,
    marginLeft: 8,
  },
  selectedCard: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  deployButton: {
    marginTop: 24,
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  deployButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default DeployScreen;