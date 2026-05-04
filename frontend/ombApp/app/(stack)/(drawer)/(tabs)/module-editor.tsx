import { ModuleEditSummaryModal } from '@/components/shared/ModuleEditSummaryModal';
import ModelFieldsEditor from '@/components/model/ModelFieldsEditor';
import ModelViewsEditor from '@/components/model/ModelViewsEditor';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useCreateModule } from '@/presentation/hooks/useCreateModule';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { moduleCategoryIcons } from '@/core/constants/moduleCategoryIcons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useModuleFull } from '@/presentation/hooks/useModuleFull';
import { useUpdateModule } from '@/presentation/hooks/useUpdateModule';
import { useUserModels } from '@/presentation/hooks/useUserModels';
import { BlockDeleteModal } from '@/core/helpers/BlockDeleteModal';
import { ombApi } from '@/core/auth/api/ombApi';

// Pantalla de creación y edición de módulos
const ModuleEditorScreen = () => {
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
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [redirectMessage, setRedirectMessage] = useState('');

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

  // Memoizar los modelos propios para el selector de relaciones (incluye modelos locales y guardados)
  const memoizedOwnModels = React.useMemo(() => {
    // 1. Modelos guardados (excluyendo los del módulo actual que ya están en localModels)
    const savedModels = userModels
      .filter(m => !m.module || m.module.technicalName !== technicalName)
      .map(m => ({
        id: m.id,
        technicalName: m.technicalName,
        name: m.name,
        module: m.module,
        fields: []
      }));

    // 2. Modelos locales del módulo actual
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

  // Detecta si hay relaciones rotas
  const findBrokenRelations = () => {
    const errors: string[] = [];

    for (const m of localModels) {
      const fields = modelFieldsMap[m.id] || [];

      for (const f of fields) {
        if (
          ['many2one', 'one2many', 'many2many'].includes(f.type) &&
          f.relationField
        ) {
          // Buscamos el modelo destino de la relación
          const targetModelFull = f.relationModel;

          // Buscamos en localModels (los que tenemos en esta pantalla)
          const targetModel = localModels.find(lm => {
            const full = lm.module && lm.module.technicalName ? `${lm.module.technicalName}.${lm.technicalName}` : lm.technicalName;
            return full === targetModelFull;
          });

          if (targetModel) {
            const targetFields = modelFieldsMap[targetModel.id] || [];
            const exists = targetFields.some(
              field => field.technicalName === f.relationField
            );

            if (!exists) {
              errors.push(
                `Modelo "${m.name}" → Campo "${f.name}" apunta al campo "${f.relationField}" en el modelo "${targetModel.name}" que no existe`
              );
            }
          }
          // Si el modelo destino no está en localModels, es un modelo de otro módulo o estándar de Odoo.
          // En ese caso no validamos la existencia del campo aquí ya que no tenemos cargados sus campos.
        }
      }
    }

    return errors;
  };

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
    setShowModuleEditError(null);
  };

  // Resetea el formulario de edición de módulo a los valores originales
  const resetForm = () => {
    if (!moduleFull) return;
    setName(moduleFull.name || '');
    setTechnicalName(moduleFull.technicalName || '');
    setDescription(moduleFull.description || '');
    setCategory(moduleFull.category || 'otra');
    setIsPublic(moduleFull.isPublic === true);
    setLocalModels(moduleFull.models ? moduleFull.models.map((m: any) => ({ ...m })) : []);

    const fieldsMap: { [modelId: number]: any[] } = {};
    const viewsMap: { [modelId: number]: any[] } = {};
    
    (moduleFull.models || []).forEach((m: any) => {
      fieldsMap[m.id] = m.fields ? m.fields.map((f: any) => ({ ...f })) : [];
      viewsMap[m.id] = m.views ? m.views.map((v: any) => ({ ...v })) : [];
    });

    setModelFieldsMap(fieldsMap);
    setModelViewsMap(viewsMap);
    setEditingModelId(null);
    setModelForm({ name: '', technicalName: '' });
    setModelFieldErrors({});
    setShowModuleEditError(null);
    setGeneralError(null);
  };

  // Inicializa modelos y campos locales cuando se carga moduleFull
  useEffect(() => {
    if (editingId && moduleFull) {
      setLocalModels(moduleFull.models ? moduleFull.models.map((m: any) => ({ ...m })) : []);
      const fieldsMap: { [modelId: number]: any[] } = {};
      const viewsMap: { [modelId: number]: any[] } = {};
      
      (moduleFull.models || []).forEach((m: any) => {
        fieldsMap[m.id] = m.fields ? m.fields.map((f: any) => ({ ...f })) : [];
        viewsMap[m.id] = m.views ? m.views.map((v: any) => ({ ...v })) : [];
      });
      
      setModelFieldsMap(fieldsMap);
      setModelViewsMap(viewsMap);
   
    } else if (!editingId) {
      setLocalModels([]);
      setModelFieldsMap({});
      setModelViewsMap({});
    }
  }, [editingId, moduleFull]);

  // Valida y actualiza el estado local, no la API
  const handleSaveModel = () => {
    const errors = validateModel();
    if (errors) return;
    if (!editingId) return;
    if (editingModelId) {
      // Edición local de modelo existente
      setLocalModels(prev => prev.map(m => m.id === editingModelId ? { ...m, ...modelForm } : m));
      setEditingModelId(null);
      setModelForm({ name: '', technicalName: '' });
      setModelFieldErrors({});
    } else {
      // Crear modelo localmente (asigna id temporal negativo)
      const tempId = Math.min(0, ...localModels.map(m => m.id ?? 0), ...Object.keys(modelFieldsMap).map(Number)) - 1;
      setLocalModels(prev => [...prev, { id: tempId, ...modelForm }]);
      setModelFieldsMap(prev => ({ ...prev, [tempId]: [] }));
      setModelViewsMap(prev => ({ ...prev, [tempId]: [] }));
      setEditingModelId(null);
      setModelForm({ name: '', technicalName: '' });
      setModelFieldErrors({});
    }
  };

  const handleEditModel = (model: any) => {
    setEditingModelId(model.id);
    setModelForm({
      name: model.name || '',
      technicalName: model.technicalName || '',
    });
    setModelFieldErrors({});
  };

  // Guardar cambios
  const handleUpdate = async () => {
    // Validación de duplicados en technical_name
    // 1. Duplicados en modelos
    const modelNames = localModels.map(m => m.technicalName.trim());
    const modelDup = modelNames.find((name, idx) => modelNames.indexOf(name) !== idx);
    if (modelDup) {
      setGeneralError(`Hay modelos con el mismo nombre técnico: '${modelDup}'. Cambia los nombres técnicos para que sean únicos.`);
      return;
    }
    // 2. Duplicados en campos de cada modelo
    for (const m of localModels) {
      const fields = modelFieldsMap[m.id] || [];
      const fieldNames = fields.map(f => f.technicalName.trim());
      const fieldDup = fieldNames.find((name, idx) => fieldNames.indexOf(name) !== idx);
      if (fieldDup) {
        setGeneralError(`En el modelo '${m.name}' hay campos con el mismo nombre técnico: '${fieldDup}'. Cambia los nombres técnicos para que sean únicos.`);
        return;
      }
    }

    if (!hasChanged) {
      setNoChangesError(true);
      setTimeout(() => setNoChangesError(false), 2000);
      return;
    }

    setNoChangesError(false);
    const errors = validate();
    setError('');
    setFieldErrors({});
    if (errors) return;
    if (!user?.id) {
      setError('No se ha encontrado el usuario autenticado.');
      return;
    }
    const ok = await update(editingId!, {
      name,
      technicalName,
      description,
      isPublic,
      category,
      user_id: user.id,
      author: user.username,
      models: localModels.map(m => ({
        ...m,
        fields: modelFieldsMap[m.id] || [],
        views: modelViewsMap[m.id] || []
      })),
    });
    if (ok === true) {
      setError('');
      setFieldErrors({});
      setGeneralError(null);
      reload && reload();
      setShowUpdateSuccess(true);
      // Evento global para recargar listas
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('modules-updated'));
      }
      setTimeout(() => {
        setShowUpdateSuccess(false);
        if (typeof editingId === 'number' && !isNaN(editingId)) {
          router.push({ pathname: '/(stack)/(drawer)/(tabs)/modules', params: { id: String(editingId) } });
        }
      }, 2000);
      return;
    } else if (typeof ok === 'string' && ok.toLowerCase().includes('technicalname already exists')) {
      setFieldErrors({ technicalName: 'El nombre técnico ya existe en otro módulo.' });
      setGeneralError(null);
      setTimeout(() => {
        if (technicalNameRef.current && typeof technicalNameRef.current.focus === 'function') {
          technicalNameRef.current.focus();
          technicalNameRef.current.blur();
        }
      }, 100);
    } else if (typeof ok === 'string') {
      setGeneralError(ok);
    }
  };

  // Cuando se cargan los datos del módulo, inicializa el formulario
  useEffect(() => {
    if (editingId && moduleFull) {
      setName(moduleFull.name || '');
      setTechnicalName(moduleFull.technicalName || '');
      setDescription(moduleFull.description || '');

      // Normaliza la categoría solo si es válida, si no, usa 'otra'
      const cat = (moduleFull.category || '').toLowerCase();
      setCategory(categoryOptions.includes(cat) ? cat : 'otra');
      setIsPublic(moduleFull.isPublic === true);
   
    } else if (!editingId) {
      setName('');
      setTechnicalName('');
      setDescription('');
      setCategory('otra');
      setIsPublic(true);
      setSuccessMessage('');
      setRedirectMessage('');
    }
  }, [editingId, moduleFull]);

  // Validación básica
  const validate = () => {
    const errors: { name?: string; technicalName?: string; category?: string } = {};
    if (!name.trim()) errors.name = 'El nombre es obligatorio';
   
    if (!technicalName.trim()) errors.technicalName = 'El nombre técnico es obligatorio';
    else if (!/^([a-z_]+)$/.test(technicalName)) errors.technicalName = 'Solo minúsculas y guiones bajos en el nombre técnico';
   
    if (!category) errors.category = 'La categoría es obligatoria';
    setFieldErrors(errors);
    return Object.values(errors).length > 0 ? errors : null;
  };

  const handleCreate = async () => {
    const errors = validate();
    setError('');
    setSuccessMessage('');
    setRedirectMessage('');

    if (errors) return;
    if (!user?.id) {
      setError('No se ha encontrado el usuario autenticado.');
      return;
    }

    const result = await create({ name, technicalName, description, isPublic, user_id: user.id, author: user.username, category });
    if (result && result.data && result.data.id) {
      setError('');
      setFieldErrors({});
      setName('');
      setTechnicalName('');
      setDescription('');
      setSuccessMessage('¡Módulo creado correctamente!');

      setRedirectMessage('Serás redirigido a los detalles del módulo en 3 segundos...');
      setTimeout(() => {
        setRedirectMessage('');
        // Disparar evento global para recargar la lista de módulos
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('modules-updated'));
        }
        router.push({ pathname: '/(stack)/(drawer)/(tabs)/modules', params: { id: String(result.data.id) } });
      }, 3000);

    } else if (result && result.error) {
      setError(result.error);
      setSuccessMessage('');
      setRedirectMessage('');
    }
  };

  // Construye un resumen de los cambios para mostrar en el modal antes de guardar
  const buildModuleSummary = () => {
    if (!moduleFull) return null;
  
    // Normalización para comparación
    const normalizeString = (v: any) => (v ?? '').trim();
    const normalizeCategory = (cat: any) => {
      if (!cat) return 'otra';
      const c = cat.toLowerCase();
      if (c === 'otros' || c === 'otra') return 'otra';
      return c;
    };
   
    const descNow = normalizeString(description);
    const descOrig = normalizeString(moduleFull.description);
    const catNow = normalizeCategory(category);
    const catOrig = normalizeCategory(moduleFull.category);
    const general = [
      {
        key: 'name', label: 'Nombre',
        value: name, prevValue: moduleFull.name,
        type: name !== moduleFull.name ? 'edit' : 'unchanged',
      },
      {
        key: 'technicalName', label: 'Nombre técnico',
        value: technicalName, prevValue: moduleFull.technicalName,
        type: technicalName !== moduleFull.technicalName ? 'edit' : 'unchanged',
      },
      {
        key: 'description', label: 'Descripción',
        value: description, prevValue: moduleFull.description,
        type: descNow !== descOrig ? 'edit' : 'unchanged',
      },
      {
        key: 'category', label: 'Categoría',
        value: category, prevValue: moduleFull.category,
        type: catNow !== catOrig ? 'edit' : 'unchanged',
      },
      {
        key: 'isPublic', label: 'Público',
        value: isPublic ? 'Sí' : 'No', prevValue: moduleFull.isPublic ? 'Sí' : 'No',
        type: isPublic !== moduleFull.isPublic ? 'edit' : 'unchanged',
      },
    ];


    // Buscar cambios en modelos y campos
    const originalModels = (moduleFull.models || []);
    const localModelIds = localModels.map(m => m.id);

    function getLocalModelById(id: any) {
      const fields = modelFieldsMap[id] || [];
      if (fields.length > 0 && fields[0].model) {
        return fields[0].model;
      }
      return null;
    }

    const models: any[] = [];
    // 1. Detectar modelos borrados (están en original pero no en local)
    for (const origModel of originalModels) {
      if (!localModelIds.includes(origModel.id)) {
        models.push({
          id: origModel.id,
          name: origModel.name,
          technicalName: origModel.technicalName,
          changeType: 'delete',
          fields: (origModel.fields || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            technicalName: f.technicalName,
            type: f.type,
            changeType: 'delete',
          })),
        });
      }
    }
   
    // 2. Detectar modelos nuevos y editados (están en local pero no en original)
    for (const id of localModelIds) {
      const localModel = localModels.find(m => m.id === id);
      const origModel = originalModels.find((m: any) => m.id === id);
      if (!localModel) continue;
      if (!origModel) {
        models.push({
          id,
          name: localModel.name,
          technicalName: localModel.technicalName,
          changeType: 'new',
          fields: (modelFieldsMap[id] || []).map(f => ({
            id: f.id,
            name: f.name,
            technicalName: f.technicalName,
            type: f.type,
            changeType: 'new',
          })),
          views: (modelViewsMap[id] || []).map(v => ({
            id: v.id,
            name: v.name,
            type: v.type,
            changeType: 'new',
          })),
        });

      } else {
        // Si ha sido cambiado
        const isEdited = (localModel.name !== origModel.name) || (localModel.technicalName !== origModel.technicalName);
        // Campos cambiados
        const origFields = origModel.fields || [];
        const localFields = modelFieldsMap[id] || [];
        const origFieldIds = origFields.map((f: any) => f.id);
        const localFieldIds = localFields.map((f: any) => f.id);
        const fieldsSummary = [];

        // Campos borrados
        for (const ofield of origFields) {
          if (!localFieldIds.includes(ofield.id)) {
            fieldsSummary.push({
              id: ofield.id,
              name: ofield.name,
              technicalName: ofield.technicalName,
              type: ofield.type,
              changeType: 'delete',
            });
          }
        }

        // Campos nuevos
        for (const lfield of localFields) {
          const ofield = origFields.find((f: any) => f.id === lfield.id);
          // Si no existe en original, es nuevo
          if (!ofield) {
            fieldsSummary.push({
              id: lfield.id,
              name: lfield.name,
              technicalName: lfield.technicalName,
              type: lfield.type,
              changeType: 'new',
            });
          } else {
            // Si existe, detecta si ha sido editado
            const isFieldEdited = lfield.name !== ofield.name || lfield.technicalName !== ofield.technicalName || lfield.type !== ofield.type;
            fieldsSummary.push({
              id: lfield.id,
              name: lfield.name,
              technicalName: lfield.technicalName,
              type: lfield.type,
              changeType: isFieldEdited ? 'edit' : 'unchanged',
            });
          }
        }

        // 3. Vistas cambiadas
        const origViews = origModel.views || [];
        const localViews = modelViewsMap[id] || [];
        const origViewIds = origViews.map((v: any) => v.id);
        const localViewIds = localViews.map((v: any) => v.id);
        const viewsSummary = [];

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

        if (isEdited || fieldsSummary.length > 0 || viewsSummary.length > 0) {
          models.push({
            id,
            name: localModel.name,
            technicalName: localModel.technicalName,
            changeType: isEdited ? 'edit' : 'unchanged',
            fields: fieldsSummary,
            views: viewsSummary,
          });
        }
      }
    }

    return {
      name: general[0],
      technicalName: general[1],
      description: general[2],
      category: general[3],
      isPublic: general[4],
      models,
    };
  };

  // Componente reutilizable para los campos del formulario de módulo
  type ModuleFormFieldsProps = {
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
  };

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
  }) => (
    <>
      <Text style={styles.label}>Nombre del módulo *</Text>
      <TextInput
        style={[styles.input, fieldErrors.name && styles.inputError]}
        value={name}
        onChangeText={setName}
        placeholder="Ej: Academia"
        onFocus={() => {
          if (!isEditing && !technicalName) setSyncTechName(true);
        }}
        onBlur={() => setSyncTechName(false)}
      />
      {fieldErrors.name && <Text style={styles.error}>{fieldErrors.name}</Text>}

      <Text style={styles.label}>Nombre técnico *</Text>
      <TextInput
        ref={technicalNameRef}
        style={fieldErrors.technicalName ? [styles.input, styles.inputError] : styles.input}
        value={technicalName}
        onChangeText={setTechnicalName}
        placeholder="Ej: academia_modulo"
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

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Descripción breve del módulo"
        multiline
      />

      <Text style={styles.label}>Categoría *</Text>
      <View style={[{ borderWidth: 1, borderColor: fieldErrors.category ? '#FF6B6B' : Colors.light.border, borderRadius: 8, marginBottom: 8 }]}>
        <Picker
          selectedValue={category}
          onValueChange={setCategory}
          style={{ height: 44 }}
        >
          {categoryOptions.map((cat: string) => (
            <Picker.Item key={cat} label={cat === 'otra' ? 'Otra' : cat.charAt(0).toUpperCase() + cat.slice(1)} value={cat} />
          ))}
        </Picker>
      </View>
      
      {fieldErrors.category && <Text style={styles.error}>{fieldErrors.category}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
        <TouchableOpacity
          style={[styles.radio, isPublic && styles.radioSelected]}
          onPress={() => setIsPublic(true)}
        />
        <Text style={{ marginRight: 24 }}>Público</Text>
        <TouchableOpacity
          style={[styles.radio, !isPublic && styles.radioSelected]}
          onPress={() => setIsPublic(false)}
        />
        <Text>Privado</Text>
      </View>
    </>
  );

  // Renderizado condicional para edición
  if (editingId) {
    // EDICIÓN DE MÓDULO Y MODELOS
    if (loadingFull || !moduleFull) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
          <Text style={{ color: Colors.light.primary, fontSize: 18 }}>Cargando módulo...</Text>
        </View>
      );
    }
    return (
      <KeyboardAvoidingView
        style={[{ flex: 1 }, isDesktop && { paddingLeft: 80, backgroundColor: '#F7F7F7' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={{ flex: 1 }}>
          <View style={{ marginHorizontal: 30, marginTop: 32 }}>
            <Text style={styles.title}>Editar módulo y modelos</Text>

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
            />

            <View style={{ marginTop: 32 }}>
              <Text style={[styles.label, { fontSize: 18, marginBottom: 12 }]}>Modelos del módulo</Text>
              {/* Lista de modelos existentes */}
              {localModels && localModels.length > 0 && localModels.map((model: any) => (
                <View
                  key={model.id}
                  style={{
                    marginBottom: 18,
                    padding: 14,
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: showModuleEditError === model.id || (generalError && generalError.includes(model.technicalName)) ? '#c0392b' : Colors.light.border,
                    boxShadow: showModuleEditError === model.id || (generalError && generalError.includes(model.technicalName)) ? '0 0 0 2px #c0392b44' : undefined,
                  }}
                >

                  {editingModelId === model.id ? (
                    <>
                      <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Editar modelo</Text>
                      <TextInput
                        style={[styles.input, modelFieldErrors.name && styles.inputError]}
                        value={modelForm.name}
                        onChangeText={v => setModelForm(f => ({ ...f, name: v }))}
                        placeholder="Nombre del modelo"
                        onFocus={() => {
                          if (isNewModelEditing && !modelForm.technicalName) setSyncModelTechName(true);
                        }}
                        onBlur={() => setSyncModelTechName(false)}
                      />

                      {modelFieldErrors.name && <Text style={styles.error}>{modelFieldErrors.name}</Text>}
                      <TextInput
                        ref={modelTechnicalNameRef}
                        style={modelFieldErrors.technicalName && modelFieldErrors.technicalName !== 'No hay cambios para aceptar' ? [styles.input, styles.inputError] : styles.input}
                        value={modelForm.technicalName}
                        onChangeText={v => setModelForm(f => ({ ...f, technicalName: v }))}
                        placeholder="Nombre técnico"
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
                            <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: Colors.light.primary }]} onPress={handleSaveModel}>
                              <Text style={styles.buttonText}>Aceptar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]} onPress={handleCancelModel}>
                              <Text style={[styles.buttonText, { color: '#222' }]}>Cancelar</Text>
                            </TouchableOpacity>
                          </View>

                          {modelFieldErrors.technicalName === 'No hay cambios para aceptar' && (
                            <Text style={[styles.error, { textAlign: 'left', marginTop: 8 }]}>{modelFieldErrors.technicalName}</Text>
                          )}
                        </>
                      )}
                      {showModuleEditError === model.id && (
                        <Text style={{ color: '#c0392b', fontWeight: 'bold', marginTop: 10 }}>
                          Guarda o descarta los cambios del modelo primero.
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{model.name} <Text style={{ color: Colors.light.icon }}>({model.technicalName})</Text></Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <TouchableOpacity
                          style={{ alignSelf: 'flex-end' }}
                          onPress={() => handleEditModel(model)}
                        >
                          <Text style={{ color: Colors.light.primary, fontWeight: 'bold' }}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ alignSelf: 'flex-end' }}
                          onPress={async () => {
                            setGeneralError('No se pudo comprobar dependencias porque la lista de módulos no está disponible.');
                            return;
                          }}
                        >
                          <Text style={{ color: '#c0392b', fontWeight: 'bold' }}>Eliminar modelo</Text>
                        </TouchableOpacity>
                      </View>

                      <ModelFieldsEditor
                        fields={modelFieldsMap[model.id] || []}
                        onAddField={() => { }}
                        onEditField={() => { }}
                        onDeleteField={() => { }}
                        editable={false}
                      />

                      <ModelViewsEditor
                        views={modelViewsMap[model.id] || []}
                        modelFields={modelFieldsMap[model.id] || []}
                        editable={false}
                      />
                    </>
                  )}
                </View>
              ))}

              {/* Botón para añadir modelo siempre visible si no hay modelo en edición */}
              {editingModelId === null && (
                <TouchableOpacity
                  style={styles.addModelButton}
                  onPress={() => setEditingModelId(0)}
                >
                  <Text style={styles.addModelButtonText}>+ Añadir modelo</Text>
                </TouchableOpacity>
              )}

              {/* Formulario para añadir modelo */}
              {editingModelId === 0 && (
                <View style={{ marginTop: 18, padding: 14, backgroundColor: '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: Colors.light.border }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Añadir nuevo modelo</Text>
                  <TextInput
                    style={[styles.input, modelFieldErrors.name && styles.inputError]}
                    value={modelForm.name}
                    onChangeText={v => setModelForm(f => ({ ...f, name: v }))}
                    placeholder="Nombre del modelo"
                    onFocus={() => {
                      if (isNewModelEditing && !modelForm.technicalName) setSyncModelTechName(true);
                    }}
                    onBlur={() => setSyncModelTechName(false)}
                  />
                  {modelFieldErrors.name && <Text style={styles.error}>{modelFieldErrors.name}</Text>}

                  <TextInput
                    ref={modelTechnicalNameRef}
                    style={modelFieldErrors.technicalName && modelFieldErrors.technicalName !== 'No hay cambios para aceptar' ? [styles.input, styles.inputError] : styles.input}
                    value={modelForm.technicalName}
                    onChangeText={v => setModelForm(f => ({ ...f, technicalName: v }))}
                    placeholder="Nombre técnico"
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

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: Colors.light.primary }]} onPress={handleSaveModel}>
                      <Text style={styles.buttonText}>Crear modelo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]} onPress={handleCancelModel}>
                      <Text style={[styles.buttonText, { color: '#222' }]}>Descartar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Botones guardar y descartar del módulo, muestran error si hay modelo en edición */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 32 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: editingModelId !== null ? '#bbb' : Colors.light.primary }]}
                onPress={() => {
                  if (editingModelId !== null) {
                    setShowModuleEditError(editingModelId);
                    return;
                  }

                  const broken = findBrokenRelations();

                  if (broken.length > 0) {
                    setGeneralError(
                      "Hay relaciones inválidas:\n\n" + broken.join("\n")
                    );
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
                style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]}
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
                    router.push('/(stack)/(drawer)/(tabs)/modules');
                  }
                }}
                disabled={loadingUpdate}
              >
                <Text style={[styles.buttonText, { color: '#222' }]}>{hasChanged ? 'Limpiar' : 'Descartar'}</Text>
              </TouchableOpacity>

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
            // Eliminar ambos modelos por API y recargar
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
      style={[{ flex: 1 }, isDesktop && { paddingLeft: 80, backgroundColor: '#F7F7F7' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ marginHorizontal: 30, marginTop: 32 }}>
        <Text style={styles.title}>Crear nuevo módulo Odoo</Text>
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
        />

        {successMessage ? <Text style={{ color: '#2ecc40', marginTop: 10 }}>{successMessage}</Text> : null}
        {redirectMessage ? <Text style={{ color: '#888', marginTop: 4 }}>{redirectMessage}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {backendError && !error ? <Text style={styles.error}>{backendError}</Text> : null}
        
        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creando...' : 'Crear módulo'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
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
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  radioSelected: {
    backgroundColor: Colors.light.primary,
  },
  button: {
    marginTop: 28,
    backgroundColor: Colors.light.primary,
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
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addModelButtonText: {
    color: Colors.light.primary,
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