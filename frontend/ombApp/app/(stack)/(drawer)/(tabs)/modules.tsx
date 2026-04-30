import React, { useState, useEffect } from 'react';
import { View, useWindowDimensions, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { ModuleDetail } from '@/components/shared/ModuleDetail';
import { checkDependencies } from '@/core/helpers/checkDependencies';
import { getModuleFull } from '@/core/actions/get-module-full';
import { useAllModules } from '@/presentation/hooks/useAllModules';
import { deleteModule } from '@/core/actions/delete-module';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
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
  const { modules: allModules = [], isLoading: loadingAllModules, reload } = useAllModules();

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
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 32, alignItems: 'center', gap: 16 }}>
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
                  onPress={() => router.push({ pathname: '/module-editor', params: { moduleId: id } })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="construct" size={24} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#c0392b',
                    paddingVertical: 14,
                    paddingHorizontal: 32,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 8,
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

                    // Obtener todos los módulos completos (con modelos y campos)
                    const allModulesFull = [];
                    for (const mod of allModules) {
                      const modFull = await getModuleFull(mod.id);
                      if (modFull) allModulesFull.push(modFull);
                    }

                    // Usar helper reutilizable para comprobar dependencias
                    const thisModule = await getModuleFull(Number(id));
                    const { blockList, circularIds } = checkDependencies(
                      allModulesFull,
                      { type: 'module', id: thisModule.id, technicalName: thisModule.technicalName, models: thisModule.models }
                    );

                    // Si hay cualquier bloqueo, mostrar el modal y permitir eliminar ambos módulos o editar el campo relacional que bloquea
                    if (blockList.length > 0 || circularIds) {
                      const uniqueBlocks = blockList.filter((item, idx, arr) =>
                        arr.findIndex(x => x.moduleName === item.moduleName && x.modelName === item.modelName && x.fieldName === item.fieldName && x.fieldType === item.fieldType) === idx
                      );

                      setBlockRelations(uniqueBlocks);
                      setShowBlockModal(true);

                      if (circularIds) {
                        setDeleteBothIds(circularIds);
                      } else if (uniqueBlocks.length > 0) {
                        // Buscar el id del módulo que bloquea
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

                    // Si no hay bloqueos, eliminar
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
                  <Ionicons name="trash" size={22} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{deleteConfirmText || 'Eliminar'}</Text>
                </TouchableOpacity>

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
        )}
      </View>
    );

  } else {
    // Móvil: cambia el layout al abrir los detalles de un módulo
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