import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, useWindowDimensions, ScrollView, Modal } from 'react-native';
import { useUserModules } from '@/presentation/hooks/useUserModules';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { getColors } from '@/constants/theme';
import { getModuleFull } from '@/core/actions/get-module-full';
import { useModuleFullStore } from '@/presentation/store/useModuleFullStore';
import { useGenerateAndDownloadModule } from '@/presentation/hooks/useGenerateAndDownloadModule';
import { useDeployToOdoo } from '@/presentation/hooks/useDeployToOdoo';
import { useUserDeployments } from '@/presentation/hooks/useUserDeployments';

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
  const { deploy, isDeploying, deployResult, resetResult } = useDeployToOdoo();
  const { deployments, isLoading: loadingDeployments, refresh: refreshDeployments } = useUserDeployments(userId ?? 0);
  const [showResultModal, setShowResultModal] = useState(false);

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

  // Mostrar modal cuando cambie el resultado del deploy
  useEffect(() => {
    if (deployResult) {
      setShowResultModal(true);
    }
  }, [deployResult]);

  const handleSelect = (id: number) => {
    const full = moduleDetails[id];
    const complete = full ? isModuleComplete(full) : false;
    if (!complete) return; // No permitir seleccionar módulos incompletos
    setSelectedModuleId(prev => (prev === id ? null : id));
  };

  const handleDownloadZip = async () => {
    if (!selectedModuleId || !selectedFull) return;
    await generateAndDownload(selectedFull);
  };

  const handleDeployToOdoo = async () => {
    if (!selectedModuleId) return;
    await deploy(selectedModuleId);
    refreshDeployments(); // Refrescar el historial tras el deploy
  };

  const closeModal = () => {
    setShowResultModal(false);
    resetResult();
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const selectedFull = selectedModuleId ? moduleDetails[selectedModuleId] : null;
  const isComplete = selectedFull ? isModuleComplete(selectedFull) : false;

  return (
    <ScrollView style={[{ flex: 1, backgroundColor: colors.background }, isDesktop && { paddingLeft: 80 }]}>
      {/* Historial de despliegues - ARRIBA DEL TODO, ANCHO COMPLETO */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 16, marginBottom: 4, color: colors.primary }}>
          Historial de despliegues
        </Text>
        <Text style={{ color: colors.icon, fontSize: 13, marginBottom: 16 }}>
          Últimos despliegues realizados a Odoo
        </Text>

        {loadingDeployments ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : deployments.length === 0 ? (
          <View style={[styles.emptyHistory, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.icon, textAlign: 'center', fontSize: 14 }}>
              No hay despliegues registrados todavía.
            </Text>
          </View>
        ) : (
          <View style={{ borderRadius: 12, overflow: 'hidden' }}>
            {/* Cabecera de la tabla */}
            <View style={[styles.tableRow, { backgroundColor: colors.primary }]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Módulo</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>Nombre técnico</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>Fecha</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Estado</Text>
            </View>

            {/* Filas de la tabla */}
            {deployments.map((dep) => {
              const isSuccess = dep.status === 'success';
              const date = new Date(dep.createdAt || dep.created_at);
              const formattedDate = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View
                  key={dep.id}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: isSuccess
                        ? 'rgba(39, 174, 96, 0.08)'
                        : 'rgba(231, 76, 60, 0.08)',
                    },
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 2, color: colors.text }]} numberOfLines={1}>
                    {dep.module?.name || '—'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.5, color: colors.icon }]} numberOfLines={1}>
                    {dep.module?.technicalName || dep.module?.technical_name || '—'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.5, color: colors.text }]}>
                    {formattedDate}
                  </Text>
                  <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8 }}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isSuccess ? '#27ae60' : '#e74c3c' },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {isSuccess ? 'Éxito' : 'Error'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Separador */}
      <View style={{ height: 1, backgroundColor: colors.icon, opacity: 0.2, marginVertical: 24, marginHorizontal: 16 }} />

      {/* Sección de despliegue de módulo */}
      <View style={{ padding: 16, paddingTop: 0 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: colors.primary }}>
          Desplegar módulo Odoo
        </Text>
        <Text style={{ color: colors.icon, marginBottom: 16, fontSize: 14 }}>
          Selecciona un módulo completo y elige cómo deseas desplegarlo:
        </Text>

        {isLoading || loadingDetails ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={modules}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
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
              <Text style={{ color: colors.icon, textAlign: 'center', marginTop: 20 }}>
                No tienes módulos creados todavía.
              </Text>
            }
          />
        )}

        {selectedModule && (
          <View style={{ paddingTop: 16, paddingBottom: 32 }}>
            {/* Botón: Descargar ZIP */}
            <TouchableOpacity
              style={[
                styles.deployButton,
                { backgroundColor: colors.primary },
                !isComplete && { opacity: 0.5 },
              ]}
              onPress={handleDownloadZip}
              disabled={!isComplete}
            >
              <Text style={styles.deployButtonText}>
                Descargar ZIP - {selectedModule.name}
              </Text>
            </TouchableOpacity>

            {/* Botón: Desplegar directamente en Odoo */}
            <TouchableOpacity
              style={[
                styles.deployButton,
                { backgroundColor: '#27ae60', marginTop: 12 },
                (!isComplete || isDeploying) && { opacity: 0.5 },
              ]}
              onPress={handleDeployToOdoo}
              disabled={!isComplete || isDeploying}
            >
              {isDeploying ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.deployButtonText}>Desplegando en Odoo...</Text>
                </View>
              ) : (
                <Text style={styles.deployButtonText}>
                  Desplegar en Odoo - {selectedModule.name}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal de resultado del despliegue */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {deployResult?.success ? 'Despliegue exitoso' : 'Error en el despliegue'}
            </Text>
            
            <ScrollView style={styles.modalScroll}>
              {deployResult?.message && (
                <Text style={[styles.modalMessage, { color: colors.text }]}>
                  {deployResult.message}
                </Text>
              )}
              
              {deployResult?.error && (
                <View style={[styles.errorBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.errorText, { color: '#e74c3c' }]}>
                    {deployResult.error}
                  </Text>
                </View>
              )}
              
              {deployResult?.log && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.logLabel, { color: colors.icon }]}>Log de Odoo:</Text>
                  <View style={[styles.logBox, { backgroundColor: colors.background }]}>
                    <Text style={[styles.logText, { color: colors.text }]}>
                      {deployResult.log}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={closeModal}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  logLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  logBox: {
    padding: 12,
    borderRadius: 8,
    maxHeight: 150,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  closeButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyHistory: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  tableHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DeployScreen;
