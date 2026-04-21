import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useCreateModule } from '@/presentation/hooks/useCreateModule';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { moduleCategoryIcons } from '@/core/constants/moduleCategoryIcons';
import { Picker } from '@react-native-picker/picker';

const ModelEditorScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // Estado del formulario
  const [name, setName] = useState('');
  const [technicalName, setTechnicalName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const { create, loading, error: backendError, success } = useCreateModule();
  const user = useAuthStore(state => state.user);
  const categoryOptions = Object.keys(moduleCategoryIcons);
  const [category, setCategory] = useState('otra');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; technicalName?: string; category?: string }>({});

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
      // Limpia el formulario o redirige si quieres
      // setName(''); setTechnicalName(''); setDescription('');
      alert('¡Módulo creado correctamente!');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, isDesktop && { paddingLeft: 80, backgroundColor: '#F7F7F7' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ marginHorizontal: 30, marginTop: 32 }}>
        <Text style={styles.title}>Crear nuevo módulo Odoo</Text>
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
          style={[styles.input, fieldErrors.technicalName && styles.inputError]}
          value={technicalName}
          onChangeText={setTechnicalName}
          placeholder="Ej: academia_modulo"
          autoCapitalize="none"
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
            {categoryOptions.map((cat) => (
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
  error: {
    color: '#FF6B6B',
    marginTop: 10,
    marginBottom: 4,
  },
});

export default ModelEditorScreen;