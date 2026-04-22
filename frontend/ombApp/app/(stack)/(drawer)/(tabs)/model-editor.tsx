import ModelFieldsEditor from '@/components/model/ModelFieldsEditor';
import { useCreateModel } from '@/presentation/hooks/useCreateModel';
import { useUpdateModel } from '@/presentation/hooks/useUpdateModel';
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


const ModelEditorScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // Estado del formulario
  const { moduleId } = useLocalSearchParams();
  const editingId = moduleId ? Number(moduleId) : null;
  const isEditing = !!editingId;

  const [name, setName] = useState(isEditing ? '' : '');
  const [technicalName, setTechnicalName] = useState(isEditing ? '' : '');
  const [description, setDescription] = useState(isEditing ? '' : '');
  const [category, setCategory] = useState(isEditing ? 'otra' : 'otra');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { create, loading, error: backendError, success } = useCreateModule();
  const user = useAuthStore(state => state.user);
  const categoryOptions = Object.keys(moduleCategoryIcons);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; technicalName?: string; category?: string }>({});
  const technicalNameRef = useRef<any>(null);
  const [technicalNameFocused, setTechnicalNameFocused] = useState(false);

  const { module: moduleFull, isLoading: loadingFull, reload } = useModuleFull(editingId || 0);
  const { update, loading: loadingUpdate, error: updateError, success: updateSuccess } = useUpdateModule();

  const [editingModelId, setEditingModelId] = useState<number | null>(null);
  const [modelForm, setModelForm] = useState<{ name: string; technicalName: string }>({ name: '', technicalName: '' });
  const [modelFieldErrors, setModelFieldErrors] = useState<{ name?: string; technicalName?: string }>({});
  const modelTechnicalNameRef = useRef<any>(null);
  const [modelTechnicalNameFocused, setModelTechnicalNameFocused] = useState(false);
  const { create: createModel, loading: loadingCreateModel, error: errorCreateModel } = useCreateModel();
  const { update: updateModel, loading: loadingUpdateModel, error: errorUpdateModel } = useUpdateModel();

  // Add a new state for no changes error
  const [noChangesError, setNoChangesError] = useState(false);


  // Detecta si hay cambios en el formulario de edición de módulo
  const hasChanged = !!moduleFull && (
    name !== (moduleFull.name || '') ||
    technicalName !== (moduleFull.technicalName || '') ||
    description !== (moduleFull.description || '') ||
    category !== (categoryOptions.includes((moduleFull.category || '').toLowerCase()) ? (moduleFull.category || '').toLowerCase() : 'otra') ||
    isPublic !== (moduleFull.isPublic === true)
  );

  // Resetea el formulario de edición de módulo a los valores originales
  const resetForm = () => {
    if (!moduleFull) return;
    setName(moduleFull.name || '');
    setTechnicalName(moduleFull.technicalName || '');
    setDescription(moduleFull.description || '');
    const cat = (moduleFull.category || '').toLowerCase();
    setCategory(categoryOptions.includes(cat) ? cat : 'otra');
    setIsPublic(moduleFull.isPublic === true);
    setFieldErrors({});
    setError('');
    setGeneralError(null);
  };

  // Cancela edición de modelo
  const handleCancelModel = () => {
    setEditingModelId(null);
    setModelForm({ name: '', technicalName: '' });
    setModelFieldErrors({});
  };

  const validateModel = () => {
    const errors: { name?: string; technicalName?: string } = {};
    if (!modelForm.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!modelForm.technicalName.trim()) errors.technicalName = 'El nombre técnico es obligatorio';
    else if (!/^([a-z_]+)$/.test(modelForm.technicalName)) errors.technicalName = 'Solo minúsculas y guiones bajos';
    setModelFieldErrors(errors);
    return Object.values(errors).length > 0 ? errors : null;
  };

  const handleSaveModel = async () => {
    const errors = validateModel();
    if (errors) return;
    if (!editingId) return;
    const moduleIdNum = editingId;
    if (editingModelId) {
      // Editar
      const ok = await updateModel(editingModelId, {
        name: modelForm.name,
        technicalName: modelForm.technicalName,
        module_id: moduleIdNum,
      });
      if (ok === true) {
        setEditingModelId(null);
        setModelForm({ name: '', technicalName: '' });
        setModelFieldErrors({});
        if (reload) reload();
      } else if (typeof ok === 'string' && ok.toLowerCase().includes('technicalname already exists')) {
        setModelFieldErrors({ technicalName: 'El nombre técnico ya existe en otro modelo.' });
        setTimeout(() => {
          if (modelTechnicalNameRef.current && typeof modelTechnicalNameRef.current.focus === 'function') {
            modelTechnicalNameRef.current.focus();
            modelTechnicalNameRef.current.blur();
          }
        }, 100);
      } else if (typeof ok === 'string' && ok.toLowerCase().includes('model already exists')) {
        setModelFieldErrors({ technicalName: 'El nombre técnico ya existe en otro modelo.' });
        setTimeout(() => {
          if (modelTechnicalNameRef.current && typeof modelTechnicalNameRef.current.focus === 'function') {
            modelTechnicalNameRef.current.focus();
            modelTechnicalNameRef.current.blur();
          }
        }, 100);
      } else if (typeof ok === 'string') {
        setModelFieldErrors({ technicalName: ok });
      }
    } else {
      // Crear
      const ok = await createModel({
        name: modelForm.name,
        technicalName: modelForm.technicalName,
        module_id: moduleIdNum,
      });
      if (ok === true) {
        setModelForm({ name: '', technicalName: '' });
        setModelFieldErrors({});
        if (reload) reload();
      } else if (typeof ok === 'string' && (ok.toLowerCase().includes('model already exists') || ok.toLowerCase().includes('technicalname already exists'))) {
        setModelFieldErrors({ technicalName: 'El nombre técnico ya existe en otro modelo.' });
        setTimeout(() => {
          if (modelTechnicalNameRef.current && typeof modelTechnicalNameRef.current.focus === 'function') {
            modelTechnicalNameRef.current.focus();
            modelTechnicalNameRef.current.blur();
          }
        }, 100);
      } else if (typeof ok === 'string') {
        setModelFieldErrors({ technicalName: ok });
      }
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
    });
    if (ok === true) {
      setError('');
      setFieldErrors({});
      setGeneralError(null);
      reload && reload();
      alert('¡Cambios guardados!');
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
    if (errors) return;
    if (!user?.id) {
      setError('No se ha encontrado el usuario autenticado.');
      return;
    }
    const ok = await create({ name, technicalName, description, isPublic, user_id: user.id, author: user.username, category });
    if (ok) {
      setError('');
      setFieldErrors({});
      // Limpia el formulario
      setName('');
      setTechnicalName('');
      setDescription('');
      alert('¡Módulo creado correctamente!');
    }
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
        onFocus={() => setTechnicalNameFocused(true)}
        onBlur={() => setTechnicalNameFocused(false)}
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
              {/* Modelos existentes o botón para añadir */}
              {moduleFull.models && moduleFull.models.length > 0 ? (
                moduleFull.models.map((model: any) => (
                  <View key={model.id} style={{ marginBottom: 18, padding: 14, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: Colors.light.border }}>
                    {editingModelId === model.id ? (
                      <>
                        <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Editar modelo</Text>
                        <TextInput
                          style={[styles.input, modelFieldErrors.name && styles.inputError]}
                          value={modelForm.name}
                          onChangeText={v => setModelForm(f => ({ ...f, name: v }))}
                          placeholder="Nombre del modelo"
                        />
                        {modelFieldErrors.name && <Text style={styles.error}>{modelFieldErrors.name}</Text>}
                        <TextInput
                          ref={modelTechnicalNameRef}
                          style={modelFieldErrors.technicalName ? [styles.input, styles.inputError] : styles.input}
                          value={modelForm.technicalName}
                          onChangeText={v => setModelForm(f => ({ ...f, technicalName: v }))}
                          placeholder="Nombre técnico"
                          autoCapitalize="none"
                          returnKeyType="done"
                          onFocus={() => setModelTechnicalNameFocused(true)}
                          onBlur={() => setModelTechnicalNameFocused(false)}
                        />
                        {modelFieldErrors.technicalName && <Text style={styles.error}>{modelFieldErrors.technicalName}</Text>}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                          <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: Colors.light.primary }]} onPress={handleSaveModel} disabled={loadingUpdateModel}>
                            <Text style={styles.buttonText}>{loadingUpdateModel ? 'Guardando...' : 'Guardar'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]} onPress={handleCancelModel}>
                            <Text style={[styles.buttonText, { color: '#222' }]}>Cancelar</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{model.name} <Text style={{ color: Colors.light.icon }}>({model.technicalName})</Text></Text>
                        <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-end' }} onPress={() => handleEditModel(model)}>
                          <Text style={{ color: Colors.light.primary, fontWeight: 'bold' }}>Editar</Text>
                        </TouchableOpacity>
                        <ModelFieldsEditor modelId={model.id} editable={editingModelId === model.id} />
                      </>
                    )}
                  </View>
                ))
              ) : (
                <>
                  {editingModelId === null && !modelForm.name && !modelForm.technicalName ? (
                    <TouchableOpacity
                      style={styles.addModelButton}
                      onPress={() => setEditingModelId(0)}
                    >
                      <Text style={styles.addModelButtonText}>+ Añadir modelo</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
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
                  />
                  {modelFieldErrors.name && <Text style={styles.error}>{modelFieldErrors.name}</Text>}
                  <TextInput
                    ref={modelTechnicalNameRef}
                    style={modelFieldErrors.technicalName ? [styles.input, styles.inputError] : styles.input}
                    value={modelForm.technicalName}
                    onChangeText={v => setModelForm(f => ({ ...f, technicalName: v }))}
                    placeholder="Nombre técnico"
                    autoCapitalize="none"
                    returnKeyType="done"
                    onFocus={() => setModelTechnicalNameFocused(true)}
                    onBlur={() => setModelTechnicalNameFocused(false)}
                  />
                  {modelFieldErrors.technicalName && <Text style={styles.error}>{modelFieldErrors.technicalName}</Text>}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: Colors.light.primary }]} onPress={handleSaveModel} disabled={loadingCreateModel}>
                      <Text style={styles.buttonText}>{loadingCreateModel ? 'Creando...' : 'Crear modelo'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]} onPress={handleCancelModel}>
                      <Text style={[styles.buttonText, { color: '#222' }]}>Descartar</Text>
                    </TouchableOpacity>
                  </View>
                  {errorCreateModel && <Text style={styles.error}>{errorCreateModel}</Text>}
                </View>
              )}
            </View>
            {/* Botones guardar y descartar */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 32 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: Colors.light.primary }]}
                onPress={handleUpdate}
                disabled={loadingUpdate}
              >
                <Text style={styles.buttonText}>{loadingUpdate ? 'Guardando...' : 'Guardar cambios'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]}
                onPress={() => {
                  resetForm();
                  // Try with a valid route string for Expo Router
                  router.push('/(stack)/(drawer)/(tabs)/module-editor');
                }}
                disabled={loadingUpdate}
              >
                <Text style={[styles.buttonText, { color: '#222' }]}>{hasChanged ? 'Limpiar' : 'Descartar'}</Text>
              </TouchableOpacity>
            </View>
            {/* Solo mostrar error general si no es de technicalName y no hay errores de campo */}
            {generalError && !fieldErrors.technicalName && Object.keys(fieldErrors).length === 0 && <Text style={styles.error}>{generalError}</Text>}
            {updateSuccess && <Text style={{ color: '#2ecc40', marginTop: 10 }}>¡Cambios guardados correctamente!</Text>}
            {noChangesError && (
              <Text style={styles.error}>No hay cambios para guardar</Text>
            )}
          </View>
        </ScrollView>
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

export default ModelEditorScreen;