import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { useUserModules } from '@/presentation/hooks/useUserModules';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { getColors } from '@/constants/theme';
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
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const { modules, isLoading } = useUserModules(userId ?? 0);
  const moduleDetails = useModuleFullStore(state => state.moduleDetails);
  const setManyModuleDetails = useModuleFullStore(state => state.setManyModuleDetails);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const generateAndDownload = useGenerateAndDownloadModule();

  // Cargar detalles completos de los módulos para validar si están completos
  useEffect(() => {
    if (!modules || modules.length === 0) return;
    setLoadingDetails(true);

    const fetchDetails = async () => {
      const details: Record<number, any> = {};
      for (const mod of modules) {
        if (!moduleDetails[mod.id]) {
          try {
            const full = await getModuleFull(mod.id);
            if (full) details[mod.id] = full;
          } catch (e) {
            // ignorar errores
          }
        } else {
          details[mod.id] = moduleDetails[mod.id];
        }
      }
      setManyModuleDetails(details);
      setLoadingDetails(false);
    };

    fetchDetails();
  }, [modules]);

  const handleSelect = (id: number) => {
    const full = moduleDetails[id];
    const complete = full ? isModuleComplete(full) : false;
    if (!complete) return; // No permitir seleccionar módulos incompletos
    setSelectedModuleId(prev => (prev === id ? null : id));
  };

  const handleDeploy = async () => {
    if (!selectedModuleId) return;
    await generateAndDownload(selectedModuleId);
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const selectedFull = selectedModuleId ? moduleDetails[selectedModuleId] : null;
  const isComplete = selectedFull ? isModuleComplete(selectedFull) : false;

  return (
    <View style={[{ flex: 1, padding: 16, backgroundColor: colors.background }, isDesktop && { paddingLeft: 80 }]}>
      <View style={{ marginHorizontal: 30 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 32, marginBottom: 16, color: colors.primary }}>
          Desplegar módulo Odoo
        </Text>
      </View>

      {isLoading || loadingDetails ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={modules}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 30 }}
          renderItem={({ item }) => {
            const full = moduleDetails[item.id];
            const complete = full ? isModuleComplete(full) : false;

            return (
              <TouchableOpacity
                onPress={() => handleSelect(item.id)}
                disabled={!complete}
                activeOpacity={complete ? 0.7 : 1}
                style={[
                  { marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
                  selectedModuleId === item.id && styles.selectedCard,
                  selectedModuleId === item.id && { borderColor: colors.primary },
                  !complete && { opacity: 0.6 },
                ]}
              >
                <ModuleCard module={item} incomplete={!complete} />
                {!complete && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                    <Text style={{ color: '#e74c3c', fontSize: 12, fontStyle: 'italic' }}>
                      * Este módulo no está completo. Añade modelos y campos antes de desplegar.
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          
          ListEmptyComponent={
            <Text style={{ color: colors.icon, textAlign: 'center', marginTop: 40 }}>
              No tienes módulos creados todavía.
            </Text>
          }
        />
      )}

      {selectedModule && (
        <View style={{ paddingHorizontal: 30, paddingTop: 16, paddingBottom: 32 }}>
          <TouchableOpacity
            style={[
              styles.deployButton,
              { backgroundColor: colors.primary },
              !isComplete && { opacity: 0.5 },
            ]}
            onPress={handleDeploy}
            disabled={!isComplete}
          >
            <Text style={styles.deployButtonText}>
              {isComplete ? `Desplegar ${selectedModule.name}` : 'Módulo incompleto'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  selectedCard: {
    borderWidth: 2,
  },
  deployButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deployButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DeployScreen;
