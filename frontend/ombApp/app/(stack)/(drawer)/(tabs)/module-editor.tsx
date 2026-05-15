import { ModuleEditSummaryModal } from '@/components/shared/ModuleEditSummaryModal';
import ModelFieldsEditor from '@/components/model/ModelFieldsEditor';
import ModelViewsEditor from '@/components/model/ModelViewsEditor';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { useCreateModule } from '@/presentation/hooks/useCreateModule';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { moduleCategoryIcons } from '@/core/constants/moduleCategoryIcons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useModuleFull } from '@/presentation/hooks/useModuleFull';
import { useUpdateModule } from '@/presentation/hooks/useUpdateModule';
import { useUserModels } from '@/presentation/hooks/useUserModels';
import { blurActiveElement } from '@/core/helpers/blurActiveElement';
import { BlockDeleteModal } from '@/components/model/BlockDeleteModal';
import { checkDependencies } from '@/core/helpers/checkDependencies';
import { getModuleFull } from '@/core/actions/get-module-full';
import { ombApi } from '@/core/auth/api/ombApi';

interface ModuleFormFieldsProps {
  name: string;
  setName: (v: string) => void;
  technicalName: string;
  setTechnicalName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  categoryOptions: string[];
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  fieldErrors: { name?: string; technicalName?: string; category?: string };
  styles: any;
  colors: any;
  isEditing: boolean;
  setSyncTechName: (v: boolean) => void;
  setSyncName: (v: boolean) => void;
  technicalNameRef: React.RefObject<any>;
  setTechnicalNameFocused: (v: boolean) => void;
}

// Componente de formulario de módulo fuera para evitar pérdida de foco
const ModuleFormFields: React.FC<ModuleFormFieldsProps> = ({
  name,
  setName,
  technicalName,
  setTechnicalName,
  description,
  setDescription,
  category,
  setCategory,
  categoryOptions,
  isPublic,
  setIsPublic,
  fieldErrors,
  styles,
  colors,
  isEditing,
  setSyncTechName,
  setSyncName,
  technicalNameRef,
  setTechnicalNameFocused,
}) => (
  <>
    {/* Campos de formulario del módulo */}
    <Text style={[styles.label, { color: colors.text }]}>Nombre del módulo *</Text>
    <TextInput
      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, fieldErrors.name && styles.inputError]}
      value={name}
      onChangeText={setName}
      placeholder="Ej: Academia"
      placeholderTextColor={colors.icon}
      onFocus={() => {
        if (!isEditing && !technicalName) setSyncTechName(true);
      }}
      onBlur={() => setSyncTechName(false)}
    />
    {fieldErrors.name && <Text style={styles.error}>{fieldErrors.name}</Text>}

    <Text style={[styles.label, { color: colors.text }]}>Nombre técnico *</Text>
    <TextInput
      ref={technicalNameRef}
      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, fieldErrors.technicalName ? styles.inputError : undefined]}
      value={technicalName}
      onChangeText={setTechnicalName}
      placeholder="Ej: academia_modulo"
      placeholderTextColor={colors.icon}
      autoCapitalize="none"
      returnKeyType="done"
      onFocus={() => {
        setTechnicalNameFocused(true);
        if (!isEditing && !name) setSyncName(true);
      }}
      onBlur={() => {
        setTechnicalNameFocused(false);
        setSyncName(false);
      }}
    />
    {fieldErrors.technicalName && <Text style={styles.error}>{fieldErrors.technicalName}</Text>}

    <Text style={[styles.label, { color: colors.text }]}>Descripción</Text>
    <TextInput
      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, height: 80 }]}
      value={description}
      onChangeText={setDescription}
      placeholder="Descripción breve del módulo"
      placeholderTextColor={colors.icon}
      multiline
    />

    <Text style={[styles.label, { color: colors.text }]}>Categoría *</Text>
    <View style={[{ borderWidth: 1, borderColor: fieldErrors.category ? '#FF6B6B' : colors.border, borderRadius: 8, marginBottom: 8, backgroundColor: colors.background }]}>
      <Picker
        selectedValue={category}
        onValueChange={setCategory}
        style={{ height: 44, color: colors.text }}
      >
        {categoryOptions.map((cat: string) => (
          <Picker.Item key={cat} label={cat === 'otra' ? 'Otra' : cat.charAt(0).toUpperCase() + cat.slice(1)} value={cat} />
        ))}
      </Picker>
    </View>

    {fieldErrors.category && <Text style={styles.error}>{fieldErrors.category}</Text>}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
      <TouchableOpacity
        style={[styles.radio, { borderColor: colors.primary }]}
        onPress={() => setIsPublic(true)}
      >
        {isPublic && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
      </TouchableOpacity>
      <Text style={{ marginRight: 24, color: colors.text }}>Público</Text>

      <TouchableOpacity
        style={[styles.radio, { borderColor: colors.primary }]}
        onPress={() => setIsPublic(false)}
      >
        {!isPublic && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
      </TouchableOpacity>
      <Text style={{ color: colors.text }}>Privado</Text>
    </View>
  </>
);

// Pantalla de creación y edición de módulos
const ModuleEditorScreen = () => {
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);
  const user = useAuthStore(state => state.user);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // Hook para obtener todos los modelos del usuario
  const { models: userModels, isLoading: loadingUserModels } = useUserModels(user?.id ?? 0);

  // Si hay un id en la ruta, estamos editando ese módulo, si no, estamos creando uno nuevo
  const { moduleId } = useLocalSearchParams();
  const editingId = moduleId ? Number(moduleId) : null;
  const isEditing = !!editingId;

  // Estados del formulario
  const [name, setName] = useState(isEditing ? '' : '');
  const [technicalName, setTechnicalName] = useState(isEditing ? '' : '');
  const [description, setDescription] = useState(isEditing ? '' : '');
  const [category, setCategory] = useState(isEditing ? 'otra' : 'otra');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const clearForm = () => {
    setName('');
    setTechnicalName('');
    setDescription('');
    setCategory('otra');
    setIsPublic(false); // Por defecto privado
    setLocalModels([]);
    setModelFieldsMap({});
    setModelViewsMap({});
    setFieldErrors({});
    setError('');
    setSuccessMessage('');
    setGeneralError(null);
  };

  // Limpiar el formulario al entrar en modo creación
  useEffect(() => {
    if (!moduleId) {
      clearForm();
    }
  }, [moduleId]);

  // Errores de validación específicos por campo
  const { create, loading, error: backendError, success } = useCreateModule();
  const categoryOptions = Object.keys(moduleCategoryIcons);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; technicalName?: string; category?: string }>({});
  const technicalNameRef = useRef<any>(null);
  const [technicalNameFocused, setTechnicalNameFocused] = useState(false);

  // Sincronización controlada por foco
  const [syncTechName, setSyncTechName] = useState(false);
  const [syncName, setSyncName] = useState(false);

  useEffect(() => {
    if (!isEditing && syncTechName) {
      setTechnicalName(name.toLowerCase().replace(/\s+/g, '_'));
    }
  }, [name, isEditing, syncTechName]);

  useEffect(() => {
    if (!isEditing && syncName) {
      setName(technicalName);
    }
  }, [technicalName, isEditing, syncName]);


  // Carga datos del módulo a editar
  const { module: moduleFull, isLoading: loadingFull, reload } = useModuleFull(editingId || 0);
  const { update, loading: loadingUpdate, error: updateError } = useUpdateModule();

  // Estados para edición de modelos y campos: 
  const [showModelFieldEdit, setShowModelFieldEdit] = useState(false);
  const [editingModelId, setEditingModelId] = useState<number | null>(null);
  const [showModuleEditError, setShowModuleEditError] = useState<number | null>(null);
  const [modelForm, setModelForm] = useState<{ name: string; technicalName: string }>({ name: '', technicalName: '' });
  const [modelFieldErrors, setModelFieldErrors] = useState<{ name?: string; technicalName?: string }>({});
  const modelTechnicalNameRef = useRef<any>(null);
  const [modelTechnicalNameFocused, setModelTechnicalNameFocused] = useState(false);
  const [noChangesError, setNoChangesError] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  // Sincronización controlada por foco para modelos
  const [syncModelTechName, setSyncModelTechName] = useState(false);
  const [syncModelName, setSyncModelName] = useState(false);

  // Es un modelo nuevo si su ID es 0 (formulario añadir) o negativo (recién añadido localmente)
  const isNewModelEditing = editingModelId === 0 || (editingModelId !== null && editingModelId < 0);

  useEffect(() => {
    if (isNewModelEditing && syncModelTechName) {
      setModelForm(prev => ({
        ...prev,
        technicalName: prev.name.toLowerCase().replace(/\s+/g, '_')
      }));
    }
  }, [modelForm.name, isNewModelEditing, syncModelTechName]);

  useEffect(() => {
    if (isNewModelEditing && syncModelName) {
      setModelForm(prev => ({
        ...prev,
        name: prev.technicalName
      }));
    }
  }, [modelForm.technicalName, isNewModelEditing, syncModelName]);

  // Estado para el modal de resumen de cambios
  const [showSummaryModal, setShowSummaryModal] = useState<false | 'save' | 'discard'>(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Estado local de modelos y campos para manejar cambios antes de guardar
  const [localModels, setLocalModels] = useState<any[]>([]); // [{id, name, technicalName, ...}]
  const [modelFieldsMap, setModelFieldsMap] = useState<{ [modelId: number]: any[] }>({});
  const [modelViewsMap, setModelViewsMap] = useState<{ [modelId: number]: any[] }>({});

  // Selector de relaciones (necesita todos los modelos para mostrar opciones de relación)
  const memoizedOwnModels = React.useMemo(() => {
    // 1. Modelos guardados del usuario
    const savedModels = userModels
      .filter(m => !m.module || m.module.technicalName !== technicalName)
      .map(m => ({
        id: m.id,
        technicalName: m.technicalName,
        name: m.name,
        module: m.module,
        fields: []
      }));

    // 2. Modelos locales del modulo actual (en edición)
    const currentLocalModels = localModels.map(m => ({
      id: m.id,
      technicalName: m.technicalName,
      name: m.name,
      module: { technicalName: technicalName || 'temp_module' }, // El módulo actual
      fields: modelFieldsMap[m.id] || []
    }));

    return [...savedModels, ...currentLocalModels];
  }, [userModels, localModels, technicalName, modelFieldsMap]);

  // Estado para el modal de bloqueo de borrado de modelo
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockRelations, setBlockRelations] = useState<any[]>([]);
  const [deleteBothIds, setDeleteBothIds] = useState<[number, number] | null>(null);

  // Valida el formulario de modelo
  const validateModel = () => {
    const errors: { name?: string; technicalName?: string } = {};
    if (!modelForm.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!modelForm.technicalName.trim()) errors.technicalName = 'El nombre técnico es obligatorio';
    else if (!/^([a-z_]+)$/.test(modelForm.technicalName)) errors.technicalName = 'Solo minúsculas y guiones bajos';

    setModelFieldErrors(errors);
    return Object.values(errors).length > 0 ? errors : null;
  };

  // Detecta si hay cambios en el formulario respecto a los datos originales
  const hasChanged = React.useMemo(() => {
    if (!moduleFull) return false;

    // Datos básicos del módulo
    if (
      name !== moduleFull.name ||
      technicalName !== moduleFull.technicalName ||
      description !== moduleFull.description ||
      category !== moduleFull.category ||
      isPublic !== moduleFull.isPublic
    ) return true;

    // Modelos
    const origModels = moduleFull.models || [];
    if (localModels.length !== origModels.length) return true;

    for (let i = 0; i < localModels.length; i++) {
      const m = localModels[i];
      const om = origModels.find((om: any) => om.id === m.id);

      // El nuevo es igual al original
      if (!om || m.name !== om.name || m.technicalName !== om.technicalName) return true;
      const fields = modelFieldsMap[m.id] || [];
      const origFields = (om.fields || []);

      if (fields.length !== origFields.length) return true;
      for (let j = 0; j < fields.length; j++) {
        const f = fields[j];
        const of = origFields.find((of: any) => of.id === f.id);
        if (!of || f.name !== of.name || f.technicalName !== of.technicalName || f.type !== of.type) return true;
      }

      // Vistas
      const views = modelViewsMap[m.id] || [];
      const origViews = (om.views || []);

      if (views.length !== origViews.length) return true;
      for (let j = 0; j < views.length; j++) {
        const v = views[j];
        const ov = origViews.find((ov: any) => ov.id === v.id);
        if (!ov || v.name !== ov.name || v.type !== ov.type || JSON.stringify(v.configuration) !== JSON.stringify(ov.configuration)) return true;
      }
    }
    return false;
  }, [name, technicalName, description, category, isPublic, localModels, modelFieldsMap, moduleFull]);

  // Handlers para campos de modelo
  const handleAddField = (modelId: number, field: any) => {
    setModelFieldsMap(prev => {
      const currentFields = prev[modelId] || [];
      // Generar id temporal si no tiene uno (para editarlo antes de guardar)
      const minId = Math.min(0, ...currentFields.map(f => typeof f.id === 'number' ? f.id : 0)) - 1;
      const fieldWithId = { ...field, id: field.id ?? minId };
      return {
        ...prev,
        [modelId]: [...currentFields, fieldWithId],
      };
    });
  };

  const handleEditField = (modelId: number, fieldId: any, updated: any) => {
    setModelFieldsMap(prev => ({
      ...prev,
      [modelId]: (prev[modelId] || []).map(f => {
        // Editar campos nuevos sin id (usando technicalName)
        const match = f.id === fieldId || (f.id === undefined && f.technicalName === fieldId);
        return match ? { ...f, ...updated } : f;
      }),
    }));
  };

  const handleDeleteField = (modelId: number, fieldId: any) => {
    setModelFieldsMap(prev => ({
      ...prev,
      [modelId]: (prev[modelId] || []).filter(f => {
        // Permitir eliminar campos nuevos sin id (usando technicalName)
        const match = f.id === fieldId || (f.id === undefined && f.technicalName === fieldId);
        return !match;
      }),
    }));
  };

  // Handlers para vistas de modelo
  const handleAddView = (modelId: number, view: any) => {
    setModelViewsMap(prev => {
      const currentViews = prev[modelId] || [];
      return {
        ...prev,
        [modelId]: [...currentViews, view],
      };
    });
  };

  const handleDeleteView = (modelId: number, viewId: any) => {
    setModelViewsMap(prev => ({
      ...prev,
      [modelId]: (prev[modelId] || []).filter(v => v.id !== viewId),
    }));
  };

  // Cancela la edición/creación de modelo
  const handleCancelModel = () => {
    setEditingModelId(null);
    setModelForm({ name: '', technicalName: '' });
    setModelFieldErrors({});
  };

  // Guarda el modelo (nuevo o editado)
  const handleSaveModel = () => {
    const err = validateModel();
    if (err) return;

    if (editingModelId === 0) {
      // Crear nuevo modelo local
      const newId = -Math.floor(Math.random() * 100000);
      const newModel = {
        id: newId,
        name: modelForm.name,
        technicalName: modelForm.technicalName,
      };
      setLocalModels(prev => [...prev, newModel]);
      setModelFieldsMap(prev => ({ ...prev, [newId]: [] }));
      setModelViewsMap(prev => ({ ...prev, [newId]: [] }));
      handleCancelModel();

    } else if (editingModelId !== null) {
      // Editar modelo existente
      const hasModelChanges = localModels.some(m =>
        m.id === editingModelId &&
        (m.name !== modelForm.name || m.technicalName !== modelForm.technicalName)
      );

      if (!hasModelChanges) {
        // Verificar si hay cambios en campos o vistas
        const fields = modelFieldsMap[editingModelId] || [];
        const views = modelViewsMap[editingModelId] || [];
        const origModel = moduleFull?.models?.find((m: any) => m.id === editingModelId);
        const origFields = origModel?.fields || [];
        const origViews = origModel?.views || [];

        const fieldsChanged = fields.length !== origFields.length ||
          fields.some((f: any, idx: number) => {
            const of = origFields[idx];
            return !of || f.name !== of.name || f.technicalName !== of.technicalName || f.type !== of.type;
          });

        const viewsChanged = views.length !== origViews.length ||
          views.some((v: any, idx: number) => {
            const ov = origViews[idx];
            return !ov || v.name !== ov.name || v.type !== ov.type || JSON.stringify(v.configuration) !== JSON.stringify(ov.configuration);
          });

        if (!fieldsChanged && !viewsChanged) {
          setModelFieldErrors({ technicalName: 'No hay cambios para aceptar' });
          return;
        }
      }

      setLocalModels(prev =>
        prev.map(m => m.id === editingModelId ? { ...m, ...modelForm } : m)
      );
      handleCancelModel();
    }
  };

  // Inicia la edición de un modelo
  const handleEditModel = (model: any) => {
    setEditingModelId(model.id);
    setModelForm({ name: model.name, technicalName: model.technicalName });
    setModelFieldErrors({});
    setShowModuleEditError(null);
  };

  // Resetea el formulario de edición a los datos originales
  const resetForm = () => {
    if (moduleFull) {
      setName(moduleFull.name);
      setTechnicalName(moduleFull.technicalName);
      setDescription(moduleFull.description || '');
      setCategory(moduleFull.category || 'otra');
      setIsPublic(moduleFull.isPublic);
      setLocalModels(moduleFull.models?.map((m: any) => ({ id: m.id, name: m.name, technicalName: m.technicalName })) || []);
      const fieldsMap: any = {};
      const viewsMap: any = {};
      (moduleFull.models || []).forEach((m: any) => {
        fieldsMap[m.id] = m.fields || [];
        viewsMap[m.id] = m.views || [];
      });
      setModelFieldsMap(fieldsMap);
      setModelViewsMap(viewsMap);
    }
  };

  // Carga los datos del módulo cuando se recibe moduleFull
  useEffect(() => {
    if (moduleFull) {
      setName(moduleFull.name);
      setTechnicalName(moduleFull.technicalName);
      setDescription(moduleFull.description || '');
      setCategory(moduleFull.category || 'otra');
      setIsPublic(moduleFull.isPublic);
      setLocalModels(moduleFull.models?.map((m: any) => ({ id: m.id, name: m.name, technicalName: m.technicalName })) || []);
      const fieldsMap: any = {};
      const viewsMap: any = {};
      (moduleFull.models || []).forEach((m: any) => {
        fieldsMap[m.id] = m.fields || [];
        viewsMap[m.id] = m.views || [];
      });
      setModelFieldsMap(fieldsMap);
      setModelViewsMap(viewsMap);
    }
  }, [moduleFull]);

  // Handlers para crear módulo
  const handleCreate = async () => {
    const errs: { name?: string; technicalName?: string; category?: string } = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio';
    if (!technicalName.trim()) errs.technicalName = 'El nombre técnico es obligatorio';
    else if (!/^[a-z_]+$/.test(technicalName)) errs.technicalName = 'Solo minúsculas y guiones bajos';
    if (!category) errs.category = 'Selecciona una categoría';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setError('');
    setSuccessMessage('');

    const result = await create({
      name,
      technicalName,
      description,
      category,
      isPublic,
      user_id: user?.id ?? 0,
    });

    if (result && !result.error) {
      setSuccessMessage('¡Módulo creado correctamente!');
      setTimeout(() => {
        blurActiveElement();
        router.push('/(stack)/(drawer)/(tabs)/modules');
      }, 800);
    } else {
      setError(result?.error || 'Error al crear el módulo');
    }
  };

  // Handlers para actualizar módulo
  const handleUpdate = async () => {
    if (!moduleFull) return;

    const result = await update(moduleFull.id, {
      name,
      technicalName,
      description,
      category,
      isPublic,
      models: localModels.map(m => {
        const fields = modelFieldsMap[m.id] || [];
        const views = modelViewsMap[m.id] || [];
        return {
          id: m.id,
          name: m.name,
          technicalName: m.technicalName,
          fields,
          views,
        };
      }),
    });

    if (result === true) {
      setShowUpdateSuccess(true);
      setTimeout(() => {
        setShowUpdateSuccess(false);
        blurActiveElement();
        router.push(`/(stack)/(drawer)/(tabs)/modules?id=${moduleFull.id}`);
      }, 1500);
    } else {
      setGeneralError(typeof result === 'string' ? result : 'Error al guardar los cambios');
    }
  };

  // Construye el resumen de cambios para el modal
  const buildModuleSummary = () => {
    if (!moduleFull) return null;

    const buildChange = (label: string, changed: boolean, value?: string, prevValue?: string) => ({
      type: changed ? 'edit' as const : 'unchanged' as const,
      label,
      value: changed ? value : prevValue,
      prevValue: changed ? prevValue : undefined,
    });

    const nameChange = buildChange(
      'Nombre',
      name !== moduleFull.name,
      name,
      moduleFull.name
    );
    const technicalNameChange = buildChange(
      'Nombre técnico',
      technicalName !== moduleFull.technicalName,
      technicalName,
      moduleFull.technicalName
    );
    const descriptionChange = buildChange(
      'Descripción',
      description !== (moduleFull.description || ''),
      description ? 'Modificada' : '(vacía)',
      moduleFull.description || '(vacía)'
    );
    const categoryChange = buildChange(
      'Categoría',
      category !== (moduleFull.category || 'otra'),
      category,
      moduleFull.category || 'otra'
    );
    const isPublicChange = buildChange(
      'Visibilidad',
      isPublic !== moduleFull.isPublic,
      isPublic ? 'Público' : 'Privado',
      moduleFull.isPublic ? 'Público' : 'Privado'
    );

    const models: any[] = [];
    const origModels = moduleFull.models || [];

    // Modelos borrados
    const localModelIds = localModels.map(m => m.id);
    for (const om of origModels) {
      if (!localModelIds.includes(om.id)) {
        models.push({
          id: om.id,
          name: om.name,
          technicalName: om.technicalName,
          changeType: 'delete',
          fields: [],
          views: [],
        });
      }
    }

    // Modelos nuevos o editados
    for (const localModel of localModels) {
      const origModel = origModels.find((m: any) => m.id === localModel.id);
      const isEdited = !origModel ||
        localModel.name !== origModel.name ||
        localModel.technicalName !== origModel.technicalName;

      const fieldsSummary: any[] = [];
      const localFields = modelFieldsMap[localModel.id] || [];
      const origFields = origModel?.fields || [];
      const localFieldIds = localFields.map((f: any) => f.id);

      // Campos borrados
      for (const of2 of origFields) {
        if (!localFieldIds.includes(of2.id)) {
          fieldsSummary.push({
            id: of2.id,
            name: of2.name,
            technicalName: of2.technicalName,
            changeType: 'delete',
          });
        }
      }

      // Campos nuevos o editados
      for (const lf of localFields) {
        const of2 = origFields.find((f: any) => f.id === lf.id);
        if (!of2) {
          fieldsSummary.push({
            id: lf.id,
            name: lf.name,
            technicalName: lf.technicalName,
            changeType: 'new',
          });
        } else {
          const fEdited = lf.name !== of2.name || lf.technicalName !== of2.technicalName || lf.type !== of2.type;
          if (fEdited) {
            fieldsSummary.push({
              id: lf.id,
              name: lf.name,
              technicalName: lf.technicalName,
              changeType: 'edit',
            });
          }
        }
      }

      const viewsSummary: any[] = [];
      const localViews = modelViewsMap[localModel.id] || [];
      const origViews = origModel?.views || [];
      const localViewIds = localViews.map((v: any) => v.id);

      // Vistas borradas
      for (const oview of origViews) {
        if (!localViewIds.includes(oview.id)) {
          viewsSummary.push({
            id: oview.id,
            name: oview.name,
            type: oview.type,
            changeType: 'delete',
          });
        }
      }

      // Vistas nuevas o editadas
      for (const lview of localViews) {
        const oview = origViews.find((v: any) => v.id === lview.id);

        if (!oview) {
          viewsSummary.push({
            id: lview.id,
            name: lview.name,
            type: lview.type,
            changeType: 'new',
          });

        } else {
          const vEdited = (lview.name !== oview.name) || (lview.type !== oview.type) || (JSON.stringify(lview.configuration) !== JSON.stringify(oview.configuration));
          if (vEdited) {
            viewsSummary.push({
              id: lview.id,
              name: lview.name,
              type: lview.type,
              changeType: 'edit',
            });
          }
        }
      }

      models.push({
        id: localModel.id,
        name: localModel.name,
        technicalName: localModel.technicalName,
        changeType: isEdited ? 'edit' : 'unchanged',
        fields: fieldsSummary,
        views: viewsSummary,
      });
    }

    return {
      name: nameChange,
      technicalName: technicalNameChange,
      description: descriptionChange,
      category: categoryChange,
      isPublic: isPublicChange,
      models,
    };
  };


  // Renderizado condicional para edición
  if (editingId) {
    // EDICIÓN DE MÓDULO Y MODELOS
    if (loadingFull || !moduleFull) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>Cargando módulo...</Text>
        </View>
      );
    }
    return (
      <KeyboardAvoidingView
        style={[{ flex: 1, backgroundColor: colors.background }, isDesktop && { paddingLeft: 80 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={{ flex: 1 }}>
          <View style={{ marginHorizontal: 30, marginTop: 32 }}>
            <Text style={[styles.title, { color: colors.primary }]}>Editar módulo y modelos</Text>

            {/* Formulario de edición del módulo */}
            <ModuleFormFields
              name={name}
              setName={setName}
              technicalName={technicalName}
              setTechnicalName={setTechnicalName}
              description={description}
              setDescription={setDescription}
              category={category}
              setCategory={setCategory}
              categoryOptions={categoryOptions}
              isPublic={isPublic}
              setIsPublic={setIsPublic}
              fieldErrors={fieldErrors}
              styles={styles}
              colors={colors}
              isEditing={isEditing}
              setSyncTechName={setSyncTechName}
              setSyncName={setSyncName}
              technicalNameRef={technicalNameRef}
              setTechnicalNameFocused={setTechnicalNameFocused}
            />

            <View style={{ marginTop: 32 }}>
              <Text style={[styles.label, { fontSize: 18, marginBottom: 12, color: colors.text }]}>Modelos del módulo</Text>
              {/* Lista de modelos existentes */}
              {localModels && localModels.length > 0 && localModels.map((model: any) => (
                <View
                  key={model.id}
                  style={{
                    marginBottom: 18,
                    padding: 14,
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: showModuleEditError === model.id || (generalError && generalError.includes(model.technicalName)) ? '#c0392b' : colors.border,
                    boxShadow: showModuleEditError === model.id || (generalError && generalError.includes(model.technicalName)) ? '0 0 0 2px #c0392b44' : undefined,
                  }}
                >

                  {editingModelId === model.id ? (
                    <>
                      <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6, color: colors.text }}>Editar modelo</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, modelFieldErrors.name && styles.inputError]}
                        value={modelForm.name}
                        onChangeText={v => setModelForm(f => ({ ...f, name: v }))}
                        placeholder="Nombre del modelo"
                        placeholderTextColor={colors.icon}
                        onFocus={() => {
                          if (isNewModelEditing && !modelForm.technicalName) setSyncModelTechName(true);
                        }}
                        onBlur={() => setSyncModelTechName(false)}
                      />

                      {modelFieldErrors.name && <Text style={styles.error}>{modelFieldErrors.name}</Text>}
                      <TextInput
                        ref={modelTechnicalNameRef}
                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, modelFieldErrors.technicalName && modelFieldErrors.technicalName !== 'No hay cambios para aceptar' ? styles.inputError : undefined]}
                        value={modelForm.technicalName}
                        onChangeText={v => setModelForm(f => ({ ...f, technicalName: v }))}
                        placeholder="Nombre técnico"
                        placeholderTextColor={colors.icon}
                        autoCapitalize="none"
                        returnKeyType="done"
                        onFocus={() => {
                          setModelTechnicalNameFocused(true);
                          if (isNewModelEditing && !modelForm.name) setSyncModelName(true);
                        }}
                        onBlur={() => {
                          setModelTechnicalNameFocused(false);
                          setSyncModelName(false);
                        }}
                      />

                      {/* Solo mostrar errores distintos a 'No hay cambios para aceptar' debajo del input */}
                      {modelFieldErrors.technicalName && modelFieldErrors.technicalName !== 'No hay cambios para aceptar' && (
                        <Text style={styles.error}>{modelFieldErrors.technicalName}</Text>
                      )}

                      {/* Editor de campos con estado y handlers globales */}
                      <ModelFieldsEditor
                        fields={modelFieldsMap[model.id] || []}
                        onAddField={(field: any) => handleAddField(model.id, field)}
                        onEditField={(id: number, updated: any) => handleEditField(model.id, id, updated)}
                        onDeleteField={(id: number) => handleDeleteField(model.id, id)}
                        editable={true}
                        ownModels={memoizedOwnModels}
                        onEditStateChange={(editing: boolean) => setShowModelFieldEdit(editing)}
                        renderFieldActions={(field: any) => (
                          <TouchableOpacity
                            style={{ marginLeft: 8, padding: 4 }}
                            onPress={() => handleDeleteField(model.id, field.id)}
                          >
                            <Text style={{ color: '#c0392b', fontWeight: 'bold' }}>Eliminar</Text>
                          </TouchableOpacity>
                        )}
                      />

                      <ModelViewsEditor
                        views={modelViewsMap[model.id] || []}
                        onAddView={(v: any) => handleAddView(model.id, v)}
                        onDeleteView={(id: any) => handleDeleteView(model.id, id)}
                        modelFields={modelFieldsMap[model.id] || []}
                        editable={true}
                      />

                      {!showModelFieldEdit && (
                        <>
                          <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
                            <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: colors.primary }]} onPress={handleSaveModel}>
                              <Text style={styles.buttonText}>Aceptar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: isDarkMode ? colors.border : '#e9ecef' }]} onPress={handleCancelModel}>
                              <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
                            </TouchableOpacity>
                          </View>

                          {modelFieldErrors.technicalName === 'No hay cambios para aceptar' && (
                            <Text style={[styles.error, { textAlign: 'left', marginTop: 8 }]}>{modelFieldErrors.technicalName}</Text>
                          )}
                        </>
                      )}
                      {showModuleEditError === model.id && (
                        <Text style={{ color: '#c0392b', fontWeight: 'bold', marginTop: 10 }}>
                          Guarda o descarta los cambios del modelo primero.</Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text }}>{model.name} <Text style={{ color: colors.icon }}>({model.technicalName})</Text></Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <TouchableOpacity
                          style={{ alignSelf: 'flex-end' }}
                          onPress={() => handleEditModel(model)}
                        >
                          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ alignSelf: 'flex-end' }}
                          onPress={async () => {
                            // Obtener todos los módulos completos para comprobar dependencias
                            try {
                              const allModulesFull = [];
                              const allModulesResponse = await ombApi.get('/modules');
                              const allModules = Array.isArray(allModulesResponse) ? allModulesResponse : (allModulesResponse?.data || []);
                              for (const mod of allModules) {
                                const modFull = await getModuleFull(mod.id);
                                if (modFull) allModulesFull.push(modFull);
                              }

                              const modelTechnicalName = model.technicalName;
                              const { blockList, circularIds } = checkDependencies(
                                allModulesFull,
                                { type: 'model', id: model.id, technicalName, modelTechnicalName, userId: user?.id }
                              );

                              if (blockList.length > 0 || circularIds) {
                                const uniqueBlocks = blockList.filter((item, idx, arr) =>
                                  arr.findIndex(x => x.moduleName === item.moduleName && x.modelName === item.modelName && x.fieldName === item.fieldName && x.fieldType === item.fieldType) === idx
                                );
                                setBlockRelations(uniqueBlocks);
                                if (circularIds) {
                                  setDeleteBothIds(circularIds);
                                } else {
                                  setDeleteBothIds(null);
                                }
                                setShowBlockModal(true);
                                return;
                              }
                            } catch (e) {
                              // Si falla la comprobación, permitir eliminar igualmente
                            }

                            // Sin bloqueos: eliminar modelo localmente
                            setLocalModels(prev => prev.filter(m => m.id !== model.id));
                            setLocalModels(prev => prev.filter(m => m.id !== model.id));
                            setModelFieldsMap(prev => {
                              const newMap = { ...prev };
                              delete newMap[model.id];
                              return newMap;
                            });
                            setModelViewsMap(prev => {
                              const newMap = { ...prev };
                              delete newMap[model.id];
                              return newMap;
                            });
                          }}
                        >
                          <Text style={{ color: '#c0392b', fontWeight: 'bold' }}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              ))}

              {/* Formulario para nuevo modelo */}
              {editingModelId === 0 && (
                <View
                  style={{
                    marginBottom: 18,
                    padding: 14,
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: colors.primary,
                  }}
                >
                  <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6, color: colors.text }}>Nuevo modelo</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, modelFieldErrors.name && styles.inputError]}
                    value={modelForm.name}
                    onChangeText={v => setModelForm(f => ({ ...f, name: v }))}
                    placeholder="Nombre del modelo"
                    placeholderTextColor={colors.icon}
                    onFocus={() => {
                      if (!modelForm.technicalName) setSyncModelTechName(true);
                    }}
                    onBlur={() => setSyncModelTechName(false)}
                  />
                  {modelFieldErrors.name && <Text style={styles.error}>{modelFieldErrors.name}</Text>}
                  <TextInput
                    ref={modelTechnicalNameRef}
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, modelFieldErrors.technicalName && modelFieldErrors.technicalName !== 'No hay cambios para aceptar' ? styles.inputError : undefined]}
                    value={modelForm.technicalName}
                    onChangeText={v => setModelForm(f => ({ ...f, technicalName: v }))}
                    placeholder="Nombre técnico"
                    placeholderTextColor={colors.icon}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onFocus={() => {
                      setModelTechnicalNameFocused(true);
                      if (!modelForm.name) setSyncModelName(true);
                    }}
                    onBlur={() => {
                      setModelTechnicalNameFocused(false);
                      setSyncModelName(false);
                    }}
                  />
                  {modelFieldErrors.technicalName && modelFieldErrors.technicalName !== 'No hay cambios para aceptar' && (
                    <Text style={styles.error}>{modelFieldErrors.technicalName}</Text>
                  )}

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
                    <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: colors.primary }]} onPress={handleSaveModel}>
                      <Text style={styles.buttonText}>Aceptar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: isDarkMode ? colors.border : '#e9ecef' }]} onPress={handleCancelModel}>
                      <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>

                  {showModuleEditError === 0 && (
                    <Text style={{ color: '#c0392b', fontWeight: 'bold', marginTop: 10 }}>
                      Guarda o descarta los cambios del modelo primero.</Text>
                  )}
                </View>
              )}

              {/* Botón "Añadir modelo" - siempre visible cuando no se está editando ningún modelo */}
              {editingModelId === null && (
                <TouchableOpacity
                  style={[styles.addModelButton, { borderColor: colors.primary }]}
                  onPress={() => {
                    setEditingModelId(0);
                    setModelForm({ name: '', technicalName: '' });
                    setModelFieldErrors({});
                    setShowModuleEditError(null);
                  }}
                >
                  <Text style={[styles.addModelButtonText, { color: colors.primary }]}>+ Añadir modelo</Text>
                </TouchableOpacity>
              )}

              {/* Botones de guardar/descartar */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <TouchableOpacity
                  style={[styles.button, { flex: 1, backgroundColor: colors.primary }]}
                  onPress={() => {
                    setNoChangesError(false);

                    if (editingModelId !== null) {
                      setShowModuleEditError(editingModelId);
                      return;
                    }

                    if (!hasChanged) {
                      setNoChangesError(true);
                      return;
                    }

                    setSummaryData(buildModuleSummary());
                    setShowSummaryModal('save');
                  }}
                  disabled={loadingUpdate}
                >
                  <Text style={styles.buttonText}>{loadingUpdate ? 'Guardando...' : 'Guardar cambios'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { flex: 1, backgroundColor: isDarkMode ? colors.border : '#e9ecef' }]}
                  onPress={() => {
                    if (editingModelId !== null) {
                      setShowModuleEditError(editingModelId);
                      return;
                    }

                    if (hasChanged) {
                      setSummaryData(buildModuleSummary());
                      setShowSummaryModal('discard');
                    } else {
                      resetForm();
                      blurActiveElement();
                      router.push('/(stack)/(drawer)/(tabs)/modules');
                    }
                  }}
                  disabled={loadingUpdate}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>{hasChanged ? 'Limpiar' : 'Descartar'}</Text>
                </TouchableOpacity>
              </View>

              {/* Modal de resumen de cambios */}
              <ModuleEditSummaryModal
                visible={!!showSummaryModal}
                mode={showSummaryModal === 'discard' ? 'discard' : 'save'}
                moduleData={summaryData}
                onClose={() => setShowSummaryModal(false)}
                onAccept={() => {
                  setShowSummaryModal(false);
                  if (showSummaryModal === 'discard') {
                    resetForm();
                    blurActiveElement();
                    router.push('/(stack)/(drawer)/(tabs)/modules');
                  } else {
                    handleUpdate();
                  }
                }}
              />
            </View>

            {/* Solo mostrar error general si no es de technicalName y no hay errores de campo */}
            {generalError && !fieldErrors.technicalName && Object.keys(fieldErrors).length === 0 && <Text style={styles.error}>{generalError}</Text>}
            {showUpdateSuccess && <Text style={{ color: '#2ecc40', marginTop: 10 }}>¡Cambios guardados correctamente!</Text>}
            {noChangesError && (
              <Text style={styles.error}>No hay cambios para guardar</Text>
            )}
          </View>
        </ScrollView>

        {/* Modal de bloqueo de borrado de modelo */}
        <BlockDeleteModal
          visible={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          relatedModules={blockRelations}
          showDeleteBoth={!!deleteBothIds}
          type="model"
          onDeleteBoth={async () => {
            if (deleteBothIds) {
              try {
                await Promise.all([
                  ombApi.delete(`/models/${deleteBothIds[0]}`),
                  ombApi.delete(`/models/${deleteBothIds[1]}`)
                ]);
                if (typeof reload === 'function') reload();
              } catch (e) {
                alert('Hubo un error eliminando ambos modelos. Por favor, inténtalo de nuevo.');
                return;
              }
              setShowBlockModal(false);
              setShowModuleEditError(null);
            }
          }}
        />
      </KeyboardAvoidingView>
    );
  }

  // CREACIÓN DE MÓDULO
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1, backgroundColor: colors.background }, isDesktop && { paddingLeft: 80 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ marginHorizontal: 30, marginTop: 32 }}>
        <Text style={[styles.title, { color: colors.primary }]}>Crear nuevo módulo Odoo</Text>
        <ModuleFormFields
          name={name}
          setName={setName}
          technicalName={technicalName}
          setTechnicalName={setTechnicalName}
          description={description}
          setDescription={setDescription}
          category={category}
          setCategory={setCategory}
          categoryOptions={categoryOptions}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          fieldErrors={fieldErrors}
          styles={styles}
          colors={colors}
          isEditing={isEditing}
          setSyncTechName={setSyncTechName}
          setSyncName={setSyncName}
          technicalNameRef={technicalNameRef}
          setTechnicalNameFocused={setTechnicalNameFocused}
        />

        {successMessage ? <Text style={{ color: '#2ecc40', marginTop: 10 }}>{successMessage}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {backendError && !error ? <Text style={styles.error}>{backendError}</Text> : null}

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleCreate} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creando...' : 'Crear módulo'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// Estilos
const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  button: {
    marginTop: 28,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  addModelButton: {
    marginTop: 18,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addModelButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  error: {
    color: '#FF6B6B',
    marginTop: 10,
    marginBottom: 4,
  },
});

export default ModuleEditorScreen;
