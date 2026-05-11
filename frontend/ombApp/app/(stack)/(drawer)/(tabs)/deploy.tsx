import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, useWindowDimensions, ScrollView, Modal, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserModules } from '@/presentation/hooks/useUserModules';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useThemeStore } from '@/presentation/store/useThemeStore';
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
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideIncomplete, setHideIncomplete] = useState(true);

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
    // Esperar a que termine la animación de cierre antes de limpiar el resultado
    setTimeout(() => {
      resetResult();
    }, 300);
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const selectedFull = selectedModuleId ? moduleDetails[selectedModuleId] : null;
  const isComplete = selectedFull ? isModuleComplete(selectedFull) : false;

  // Módulos filtrados para el selector: por búsqueda y por visibilidad de incompletos
  const filteredModules = useMemo(() => {
    let result = modules;
    if (hideIncomplete) {
      result = result.filter(m => {
        const full = moduleDetails[m.id];
        return full ? isModuleComplete(full) : false;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.technicalName && m.technicalName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [modules, moduleDetails, hideIncomplete, searchQuery]);

  return (
    <ScrollView style={[{ flex: 1, backgroundColor: colors.background }, isDesktop && { paddingLeft: 80 }]}>
      {/* Historial de despliegues */}
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
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>Módulo</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>Nombre técnico</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2.5 }]}>Log</Text>
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
              const logPreview = dep.log
                ? dep.log.length > 100
                  ? dep.log.substring(0, 80) + '...'
                  : dep.log
                : '—';

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
                  <Text style={[styles.tableCell, { flex: 1.5, color: colors.text }]} numberOfLines={1}>
                    {dep.module?.name || '—'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.5, color: colors.icon }]} numberOfLines={1}>
                    {dep.module?.technicalName || dep.module?.technical_name || '—'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2.5, color: colors.icon, fontSize: 11 }]} numberOfLines={2}>
                    {logPreview}
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
          Selecciona un módulo y elige cómo deseas desplegarlo:
        </Text>

        {/* Selector de módulo tipo dropdown */}
        <TouchableOpacity
          style={[styles.selectorButton, { backgroundColor: colors.card, borderColor: colors.icon }]}
          onPress={() => setShowModuleSelector(true)}
        >
          <Text
            style={[
              styles.selectorButtonText,
              { color: selectedModule ? colors.text : colors.icon },
            ]}
            numberOfLines={1}
          >
            {selectedModule ? selectedModule.name : 'Seleccionar módulo...'}
          </Text>
          <Text style={{ color: colors.icon, fontSize: 16 }}>▼</Text>
        </TouchableOpacity>

        {/* Botones de acción (solo si hay módulo seleccionado) */}
        {selectedModule && (
          <View style={{ paddingTop: 16, paddingBottom: 32 }}>
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

      {/* Modal selector de módulos con buscador */}
      <Modal
        visible={showModuleSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModuleSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.selectorModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.selectorModalHeader}>
              <Text style={[styles.selectorModalTitle, { color: colors.text }]}>
                Seleccionar módulo
              </Text>
              <TouchableOpacity onPress={() => setShowModuleSelector(false)}>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.icon }]}
              placeholder="Buscar módulo por nombre..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />

            {/* Switch para ocultar incompletos dentro del modal */}
            <View style={styles.switchRow}>
              <Text style={{ color: colors.text, fontSize: 14 }}>
                Ocultar módulos incompletos
              </Text>
              <Switch
                value={hideIncomplete}
                onValueChange={setHideIncomplete}
                trackColor={{ false: colors.icon, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Lista de módulos filtrados */}
            {isLoading || loadingDetails ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : filteredModules.length === 0 ? (
              <Text style={{ color: colors.icon, textAlign: 'center', marginTop: 20, fontSize: 14 }}>
                {searchQuery.trim()
                  ? 'No se encontraron módulos con ese nombre.'
                  : 'No hay módulos disponibles.'}
              </Text>
            ) : (
              <FlatList
                data={filteredModules}
                keyExtractor={(item) => item.id.toString()}
                style={{ marginTop: 8 }}
                renderItem={({ item }) => {
                  const full = moduleDetails[item.id];
                  const complete = full ? isModuleComplete(full) : false;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.selectorItem,
                        { borderBottomColor: colors.background },
                        selectedModuleId === item.id && { backgroundColor: colors.primary + '20' },
                        !complete && { opacity: 0.6 },
                      ]}
                      onPress={() => {
                        if (complete) {
                          setSelectedModuleId(item.id);
                          setShowModuleSelector(false);
                          setSearchQuery('');
                        }
                      }}
                      disabled={!complete}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={{ color: colors.icon, fontSize: 12 }} numberOfLines={1}>
                          {item.technicalName}
                        </Text>
                      </View>
                      {!complete && (
                        <Text style={{ color: '#e74c3c', fontSize: 11, fontStyle: 'italic', marginLeft: 8 }}>
                          Incompleto
                        </Text>
                      )}
                      {selectedModuleId === item.id && (
                        <Text style={{ color: colors.primary, fontSize: 18, marginLeft: 8 }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de resultado del despliegue */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }, deployResult?.success ? styles.modalSuccessBorder : styles.modalErrorBorder]}>
            {/* Icono de estado */}
            <View style={[styles.statusIconContainer, { backgroundColor: deployResult?.success ? '#27ae60' : '#e74c3c' }]}>
              <Ionicons
                name={deployResult?.success ? 'checkmark-circle' : 'close-circle'}
                size={32}
                color="#fff"
              />
            </View>

            <Text style={[styles.modalTitle, { color: deployResult?.success ? '#27ae60' : '#e74c3c' }]}>
              {deployResult?.success ? '¡Despliegue exitoso!' : 'Error en el despliegue'}
            </Text>
            
            <ScrollView style={styles.modalScroll}>
              {deployResult?.message && (
                <Text style={[styles.modalMessage, { color: colors.text }]}>
                  {deployResult.message}
                </Text>
              )}
              
              {deployResult?.error && (
                <View style={[styles.errorBox, { backgroundColor: colors.background, borderLeftColor: '#e74c3c' }]}>
                  <Text style={[styles.errorText, { color: '#e74c3c' }]}>
                    {deployResult.error}
                  </Text>
                </View>
              )}

              {deployResult?.restored && !deployResult?.success && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: '#fff3cd', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ffc107' }}>
                  <Text style={{ color: '#856404', fontSize: 13, lineHeight: 18 }}>
                    Se ha restaurado la versión anterior del módulo. El despliegue ha fallado, pero tu módulo anterior sigue funcionando correctamente.
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
              style={[styles.closeButton, { backgroundColor: deployResult?.success ? '#27ae60' : '#e74c3c' }]}
              onPress={closeModal}
            >
              <Ionicons
                name={deployResult?.success ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
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
  modalSuccessBorder: {
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  modalErrorBorder: {
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
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
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectorButtonText: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectorModalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },
  selectorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectorModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInput: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    marginBottom: 8,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
});

export default DeployScreen;
