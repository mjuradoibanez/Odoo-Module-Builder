import React, { useState, useEffect, useCallback } from 'react';
import { View, useWindowDimensions, FlatList, TouchableOpacity, Text, ActivityIndicator, ScrollView, Modal, TextInput, Image } from 'react-native';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { ModuleDetail } from '@/components/shared/ModuleDetail';
import { checkDependencies } from '@/core/helpers/checkDependencies';
import { getModuleFull } from '@/core/actions/get-module-full';
import { useAllModules } from '@/presentation/hooks/useAllModules';
import { deleteModule } from '@/core/actions/delete-module';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useDuplicateModule } from '@/presentation/hooks/useDuplicateModule';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { getColors, Fonts } from '@/constants/theme';
import { useLocalSearchParams, router } from 'expo-router';
import { BlockDeleteModal } from '@/components/model/BlockDeleteModal';
import { blurActiveElement } from '@/core/helpers/blurActiveElement';
import { getAvatarSource } from '@/core/constants/avatars';

// Pantalla de mis módulos y detalles
const ModuleEditorScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const user = useAuthStore(state => state.user);
  const userId = user?.id;
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);
  const { id, userId: paramUserId } = useLocalSearchParams<{ id?: string; userId?: string }>();
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(id ? Number(id) : null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockRelations, setBlockRelations] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteBothIds, setDeleteBothIds] = useState<[number, number] | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { modules: allModules = [], isLoading: loadingAllModules, reload } = useAllModules();

  // Filtros
  const [searchText, setSearchText] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');

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

  // Recargar datos cuando se actualice el avatar
  useEffect(() => {
    const handler = () => reload();
    window.addEventListener('avatar-updated', handler);
    return () => window.removeEventListener('avatar-updated', handler);
  }, [reload]);

  // Determinar si estamos viendo módulos de otro usuario
  const targetUserId = paramUserId ? Number(paramUserId) : null;
  const isViewingOtherUser = targetUserId !== null && targetUserId !== userId;

  // Obtener información del usuario
  const targetUser = isViewingOtherUser
    ? allModules.find(m => m.user?.id === targetUserId)?.user
    : null;

  // Filtrar los módulos según el usuario
  // Si es otro usuario, solo mostrar módulos públicos
  const modules = isViewingOtherUser
    ? allModules.filter(m => m.user?.id === targetUserId && m.isPublic)
    : allModules.filter(m => m.user?.id === userId);
    
  const isLoading = loadingAllModules;

  // Aplicar filtros de búsqueda y privacidad
  const filteredModules = modules.filter(m => {
    // Filtro por nombre
    if (searchText.trim() && !m.name.toLowerCase().includes(searchText.trim().toLowerCase())) {
      return false;
    }
    // Filtro por privacidad (solo para módulos propios)
    if (!isViewingOtherUser) {
      if (privacyFilter === 'public' && !m.isPublic) return false;
      if (privacyFilter === 'private' && m.isPublic) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setSearchText('');
    setPrivacyFilter('all');
  };

  // Si hay un id en la ruta, mostrar ese módulo aunque no sea del usuario
  const showOtherModule = id && (!modules.some(m => m.id === Number(id)));

  // Si seleccionas un módulo, actualiza la URL para reflejar el id
  const handleSelectModule = (moduleId: number) => {
    if (Number(id) === moduleId) {
      // Si ya está seleccionado, lo deselecciona (cierra el detalle)
      blurActiveElement();
      if (isViewingOtherUser) {
        router.replace({ pathname: '/modules', params: { userId: targetUserId } });
      } else {
        router.replace({ pathname: '/modules' });
      }
    } else {
      setSelectedModuleId(moduleId);
      if (isDesktop) {
        blurActiveElement();
        const params: Record<string, string> = { id: String(moduleId) };
        if (isViewingOtherUser) {
          params.userId = String(targetUserId);
        }
        router.replace({ pathname: '/modules', params });
      }
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string | undefined>(undefined);
  const { duplicate, isDuplicating, error: duplicateError } = useDuplicateModule();

  // Estado para el modal de renombrar antes de duplicar
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameModuleId, setRenameModuleId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameTechnicalName, setRenameTechnicalName] = useState('');

  const openRenameModal = async (moduleId: number) => {
    const full = await getModuleFull(moduleId);
    if (full) {
      setRenameName(full.name + ' (copia)');
      setRenameTechnicalName(full.technicalName + '_copia');
    } else {
      setRenameName('');
      setRenameTechnicalName('');
    }
    setRenameModuleId(moduleId);
    setShowRenameModal(true);
  };

  const handleDuplicateWithRename = async () => {
    if (!renameModuleId || !renameName.trim() || !renameTechnicalName.trim()) return;
    setShowRenameModal(false);
    const result = await duplicate(renameModuleId, userId, {
      name: renameName.trim(),
      technicalName: renameTechnicalName.trim(),
    });
    if (result) {
      await reload();
      showSuccess('¡Módulo duplicado correctamente a tu cuenta!');
      setTimeout(() => { blurActiveElement(); router.replace({ pathname: '/modules' }); }, 1500);
    } else {
      showError(duplicateError || 'No se pudo duplicar el módulo.');
    }
  };

  // Cabecera de usuario para cuando se ven módulos de otro usuario
  const renderUserHeader = () => {
    if (!isViewingOtherUser || !targetUser) return null;
    const username = targetUser.username || 'Usuario';
    const userInitial = username.charAt(0).toUpperCase();
    const avatarSource = targetUser.avatar ? getAvatarSource(targetUser.avatar) : null;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <TouchableOpacity
          onPress={() => { blurActiveElement(); router.replace({ pathname: '/modules' }); }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        {avatarSource ? (
          <Image source={avatarSource} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
        ) : (
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{userInitial}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{username}</Text>
          <Text style={{ fontSize: 13, color: colors.icon }}>Módulos de {username}</Text>
        </View>
      </View>
    );
  };

  if (isDesktop) {
    const showDetail = !!id;
    return (
      <View style={[{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }, { paddingLeft: 80 }]}>

        {/* Lista de módulos del usuario */}
        <View style={{ flex: showDetail ? 0.32 : 1, padding: 16 }}>
          <View style={{ marginHorizontal: 30 }}>
            {isViewingOtherUser ? renderUserHeader() : (
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: colors.primary }}>
                Todos tus módulos
              </Text>
            )}

            {/* Filtros: buscador + chips de privacidad */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Buscar por nombre..."
                placeholderTextColor={colors.icon}
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              {searchText.trim() || privacyFilter !== 'all' ? (
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Limpiar buscador</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Chips de privacidad (solo para módulos propios) */}
            {!isViewingOtherUser && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {(['all', 'public', 'private'] as const).map((opt) => {
                  const label = opt === 'all' ? 'Todos' : opt === 'public' ? 'Públicos' : 'Privados';
                  const isActive = privacyFilter === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setPrivacyFilter(opt)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 14,
                        borderRadius: 20,
                        backgroundColor: isActive ? colors.primary : colors.card,
                        borderWidth: 1,
                        borderColor: isActive ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ color: isActive ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : filteredModules.length === 0 ? (
            <Text style={{ color: colors.icon, marginHorizontal: 30 }}>
              {isViewingOtherUser ? 'Este usuario no tiene módulos públicos.' : 'No tienes módulos creados todavía.'}
            </Text>
          ) : (
            <FlatList
              data={filteredModules}
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
          <View style={{ flex: 0.68, padding: 16, borderLeftWidth: 1, borderLeftColor: colors.border }}>
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
                        backgroundColor: colors.primary,
                        paddingVertical: 14,
                        paddingHorizontal: 28,
                        borderRadius: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        elevation: 4,
                      }}
                      onPress={() => { blurActiveElement(); router.push({ pathname: '/module-editor', params: { moduleId: id } }); }}
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
                          { type: 'module', id: thisModule.id, technicalName: thisModule.technicalName, userId, models: thisModule.models }
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
                          blurActiveElement();
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
                    backgroundColor: colors.card,
                    borderWidth: 2,
                    borderColor: colors.primary,
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
                      setTimeout(() => { blurActiveElement(); router.replace({ pathname: '/modules' }); }, 1500);
                    } else {
                      // Si falló por conflicto de nombre, ofrecer renombrar
                      openRenameModal(Number(id));
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="copy" size={22} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 18 }}>
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
                blurActiveElement();
                router.replace({ pathname: '/modules' });
              }}
            />
          </View>
        )}

        {/* Modal para renombrar antes de duplicar */}
        <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24, width: 360, maxWidth: '90%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
                Ya tienes un módulo con ese nombre
              </Text>
              <Text style={{ fontSize: 14, color: colors.icon, marginBottom: 20 }}>
                Introduce un nombre diferente para duplicar el módulo.
              </Text>

              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 }}>Nombre</Text>
              <TextInput
                value={renameName}
                onChangeText={setRenameName}
                placeholder="Nombre del módulo"
                placeholderTextColor={colors.icon}
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 }}>Nombre técnico</Text>
              <TextInput
                value={renameTechnicalName}
                onChangeText={setRenameTechnicalName}
                placeholder="nombre_tecnico"
                placeholderTextColor={colors.icon}
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowRenameModal(false)}
                  style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary }}
                >
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleDuplicateWithRename}
                  style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: colors.primary }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Duplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );

  } else {
    // Móvil: cambia el layout al abrir los detalles de un módulo
    if (selectedModuleId !== null) {
      const isOwnModule = modules.some(m => m.id === selectedModuleId && m.user?.id === userId);
      return (
        <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
          {/* Botón de volver atrás en móvil */}
          <TouchableOpacity
            onPress={() => { blurActiveElement(); setSelectedModuleId(null); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              gap: 6,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Volver al listado</Text>
          </TouchableOpacity>

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
                      backgroundColor: colors.primary,
                      paddingVertical: 14,
                      paddingHorizontal: 24,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onPress={() => { blurActiveElement(); router.push({ pathname: '/module-editor', params: { moduleId: selectedModuleId } }); }}
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
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor: colors.primary,
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
                    setTimeout(() => { blurActiveElement(); router.replace({ pathname: '/modules' }); }, 1500);
                  } else {
                    // Si falló por conflicto de nombre, ofrecer renombrar
                    openRenameModal(selectedModuleId);
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="copy" size={20} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
                  {isDuplicating ? 'Duplicando...' : 'Duplicar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
        <View style={{ marginHorizontal: 30 }}>
          {isViewingOtherUser ? renderUserHeader() : (
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: colors.primary }}>
              Todos tus módulos
            </Text>
          )}

          {/* Filtros: buscador + chips de privacidad */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por nombre..."
              placeholderTextColor={colors.icon}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                color: colors.text,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            {searchText.trim() || privacyFilter !== 'all' ? (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Limpiar buscador</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Chips de privacidad (solo para módulos propios) */}
          {!isViewingOtherUser && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(['all', 'public', 'private'] as const).map((opt) => {
                const label = opt === 'all' ? 'Todos' : opt === 'public' ? 'Públicos' : 'Privados';
                const isActive = privacyFilter === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setPrivacyFilter(opt)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      backgroundColor: isActive ? colors.primary : colors.card,
                      borderWidth: 1,
                      borderColor: isActive ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ color: isActive ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : filteredModules.length === 0 ? (
          <Text style={{ color: colors.icon, marginHorizontal: 30 }}>
            {isViewingOtherUser ? 'Este usuario no tiene módulos públicos.' : 'No tienes módulos creados todavía.'}
          </Text>
        ) : (
          <FlatList
            data={filteredModules}
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
