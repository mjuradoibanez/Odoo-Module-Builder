import React, { useState, useEffect, useCallback } from 'react';
import { View, useWindowDimensions, FlatList, TouchableOpacity, Text, ActivityIndicator, ScrollView } from 'react-native';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { ModuleDetail } from '@/components/shared/ModuleDetail';
import { checkDependencies } from '@/core/helpers/checkDependencies';
import { getModuleFull } from '@/core/actions/get-module-full';
import { useAllModules } from '@/presentation/hooks/useAllModules';
import { deleteModule } from '@/core/actions/delete-module';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useDuplicateModule } from '@/presentation/hooks/useDuplicateModule';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useLocalSearchParams, router } from 'expo-router';
import { BlockDeleteModal } from '@/core/helpers/BlockDeleteModal';

// Pantalla de mis módulos y detalles
const ModuleEditorScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const user = useAuthStore(state => state.user);
  const userId = user?.id;
  const { id } = useLocalSearchParams();
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(id ? Number(id) : null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockRelations, setBlockRelations] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteBothIds, setDeleteBothIds] = useState<[number, number] | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { modules: allModules = [], isLoading: loadingAllModules, reload } = useAllModules();

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 3000);
  }, []);

  if (!userId) {
    return null;
  }

  // Recarga automática al editar módulos
  useEffect(() => {
    const handler = () => reload();
    window.addEventListener('modules-updated', handler);
    return () => window.removeEventListener('modules-updated', handler);
  }, [reload]);

  // Filtrar los módulos del usuario
  const modules = allModules.filter(m => m.user?.id === userId);
  const isLoading = loadingAllModules;

  // Si hay un id en la ruta, mostrar ese módulo aunque no sea del usuario
  const showOtherModule = id && (!modules.some(m => m.id === Number(id)));

  // Si seleccionas uno de tus módulos, actualiza la URL para reflejar el id
  const handleSelectModule = (moduleId: number) => {
    if (Number(id) === moduleId) {
      // Si ya está seleccionado, lo deselecciona (cierra el detalle)
      router.replace({ pathname: '/modules' });
    } else {
      setSelectedModuleId(moduleId);
      if (isDesktop) {
        router.replace({ pathname: '/modules', params: { id: moduleId } });
      }
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string | undefined>(undefined);
  const { duplicate, isDuplicating, error: duplicateError } = useDuplicateModule();

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
            <ScrollView contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={true}>
              {/* Detalle del módulo */}
              <ModuleDetail moduleId={Number(id)} />

              {/* Mensajes de éxito/error - solo texto sin fondo */}
              {successMessage ? (
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                  <Text style={{ color: '#27ae60', fontWeight: 'bold', fontSize: 15 }}>{successMessage}</Text>
                </View>
              ) : null}
              {errorMessage ? (
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                  <Text style={{ color: '#c0392b', fontWeight: 'bold', fontSize: 15 }}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Botones de acción en fila con wrap */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                {/* Botón Editar modelos solo si el módulo es del usuario */}
                {modules.some(m => m.id === Number(id) && m.user?.id === userId) && (
                  <>
                    <TouchableOpacity
                      style={{
                        backgroundColor: Colors.light.primary,
                        paddingVertical: 14,
                        paddingHorizontal: 28,
                        borderRadius: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 4,
                      }}
                      onPress={() => router.push({ pathname: '/module-editor', params: { moduleId: id } })}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="construct" size={22} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        backgroundColor: '#c0392b',
                        paddingVertical: 14,
                        paddingHorizontal: 28,
                        borderRadius: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                      disabled={deleting}
                      onPress={async () => {
                        if (!deleteConfirm) {
                          setDeleteConfirm(true);
                          setDeleteConfirmText('Pulsa de nuevo para confirmar');
                          setTimeout(() => {
                            setDeleteConfirm(false);
                            setDeleteConfirmText(undefined);
                          }, 2000);
                          return;
                        }
                        setDeleteConfirm(false);
                        setDeleteConfirmText(undefined);
                        setDeleting(true);

                        const allModulesFull = [];
                        for (const mod of allModules) {
                          const modFull = await getModuleFull(mod.id);
                          if (modFull) allModulesFull.push(modFull);
                        }

                        const thisModule = await getModuleFull(Number(id));
                        const { blockList, circularIds } = checkDependencies(
                          allModulesFull,
                          { type: 'module', id: thisModule.id, technicalName: thisModule.technicalName, models: thisModule.models }
                        );

                        if (blockList.length > 0 || circularIds) {
                          const uniqueBlocks = blockList.filter((item, idx, arr) =>
                            arr.findIndex(x => x.moduleName === item.moduleName && x.modelName === item.modelName && x.fieldName === item.fieldName && x.fieldType === item.fieldType) === idx
                          );
                          setBlockRelations(uniqueBlocks);
                          setShowBlockModal(true);
                          if (circularIds) {
                            setDeleteBothIds(circularIds);
                          } else if (uniqueBlocks.length > 0) {
                            const blockingModule = allModulesFull.find(m => m.name === uniqueBlocks[0].moduleName);
                            if (blockingModule) {
                              setDeleteBothIds([Number(id), blockingModule.id]);
                            } else {
                              setDeleteBothIds(null);
                            }
                          } else {
                            setDeleteBothIds(null);
                          }
                          setDeleting(false);
                          return;
                        }

                        const ok = await deleteModule(Number(id));
                        setDeleting(false);
                        if (ok) {
                          await reload();
                          setSelectedModuleId(null);
                          router.replace({ pathname: '/modules' });
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="trash" size={20} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{deleteConfirmText || 'Eliminar'}</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Botón Duplicar */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fff',
                    borderWidth: 2,
                    borderColor: Colors.light.primary,
                    paddingVertical: 14,
                    paddingHorizontal: 28,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    opacity: isDuplicating ? 0.6 : 1,
                  }}
                  disabled={isDuplicating}
                  onPress={async () => {
                    const result = await duplicate(Number(id), userId);

                    if (result) {
                      await reload();
                      showSuccess('¡Módulo duplicado correctamente a tu cuenta!');
                      setTimeout(() => router.replace({ pathname: '/modules' }), 1500);
                    } else {
                      showError(duplicateError || 'No se pudo duplicar el módulo.');
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="copy" size={22} color={Colors.light.primary} />
                  <Text style={{ color: Colors.light.primary, fontWeight: 'bold', fontSize: 18 }}>
                    {isDuplicating ? 'Duplicando...' : 'Duplicar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <BlockDeleteModal
              visible={showBlockModal}
              onClose={() => { setShowBlockModal(false); setDeleteBothIds(null); }}
              relatedModules={blockRelations}
              showDeleteBoth={!!deleteBothIds}
              onDeleteBoth={async () => {
                if (!deleteBothIds) return;
                setDeleting(true);
                await deleteModule(deleteBothIds[0]);
                await deleteModule(deleteBothIds[1]);
                await reload();
                setSelectedModuleId(null);
                setShowBlockModal(false);
                setDeleteBothIds(null);
                setDeleting(false);
                router.replace({ pathname: '/modules' });
              }}
            />
          </View>
        )}
      </View>
    );

  } else {
    // Móvil: cambia el layout al abrir los detalles de un módulo
    if (selectedModuleId !== null) {
      const isOwnModule = modules.some(m => m.id === selectedModuleId && m.user?.id === userId);
      return (
        <View style={{ flex: 1, padding: 16, backgroundColor: '#F7F7F7' }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={true}>
            <ModuleDetail moduleId={selectedModuleId as number} />

            {/* Mensajes de éxito/error en móvil - solo texto sin fondo */}
            {successMessage ? (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <Text style={{ color: '#27ae60', fontWeight: 'bold', fontSize: 14 }}>{successMessage}</Text>
              </View>
            ) : null}
            {errorMessage ? (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <Text style={{ color: '#c0392b', fontWeight: 'bold', fontSize: 14 }}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Botones de acción en fila con wrap */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              {/* Botón Editar/Eliminar solo si el módulo es del usuario */}
              {isOwnModule && (
                <>
                  <TouchableOpacity
                    style={{
                      backgroundColor: Colors.light.primary,
                      paddingVertical: 14,
                      paddingHorizontal: 24,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onPress={() => router.push({ pathname: '/module-editor', params: { moduleId: selectedModuleId } })}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="construct" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#c0392b',
                      paddingVertical: 14,
                      paddingHorizontal: 24,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onPress={async () => {
                      const ok = await deleteModule(selectedModuleId);
                      if (ok) {
                        await reload();
                        setSelectedModuleId(null);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Eliminar</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Botón Duplicar: para módulos propios y de otros usuarios */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderWidth: 2,
                  borderColor: Colors.light.primary,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  opacity: isDuplicating ? 0.6 : 1,
                }}
                disabled={isDuplicating}
                onPress={async () => {
                  const result = await duplicate(selectedModuleId, userId);
                  if (result) {
                    await reload();
                    showSuccess('¡Módulo duplicado correctamente a tu cuenta!');
                    setTimeout(() => router.replace({ pathname: '/modules' }), 1500);
                  } else {
                    showError(duplicateError || 'No se pudo duplicar el módulo.');
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="copy" size={20} color={Colors.light.primary} />
                <Text style={{ color: Colors.light.primary, fontWeight: 'bold', fontSize: 16 }}>
                  {isDuplicating ? 'Duplicando...' : 'Duplicar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
