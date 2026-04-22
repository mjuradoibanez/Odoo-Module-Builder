import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useFieldsOfModel } from '@/presentation/hooks/useFieldsOfModel';
import { useCreateField } from '@/presentation/hooks/useCreateField';
import { useUpdateField } from '@/presentation/hooks/useUpdateField';
import { Colors } from '@/constants/theme';

const FIELD_TYPES = [
  { label: 'Texto', value: 'char' },
  { label: 'Entero', value: 'integer' },
  { label: 'Decimal', value: 'float' },
  { label: 'Booleano', value: 'boolean' },
  { label: 'Fecha', value: 'date' },
  { label: 'Relación', value: 'relation' },
];

export function ModelFieldsEditor({ modelId, editable }: { modelId: number, editable: boolean }) {
  const { fields, loading, error, reload } = useFieldsOfModel(modelId);
  const { create, loading: loadingCreate, error: errorCreate } = useCreateField();
  const [fieldForm, setFieldForm] = useState({
    name: '',
    technicalName: '',
    type: 'char',
    required: false,
    uniqueField: false,
    relationModel: '',
    relationField: '',
  });
  const [fieldErrors, setFieldErrors] = useState<any>({});

  const validate = () => {
    const errors: any = {};
    if (!fieldForm.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!fieldForm.technicalName.trim()) errors.technicalName = 'El nombre técnico es obligatorio';
    else if (!/^([a-z_]+)$/.test(fieldForm.technicalName)) errors.technicalName = 'Solo minúsculas y guiones bajos';
    if (!fieldForm.type) errors.type = 'El tipo es obligatorio';
    setFieldErrors(errors);
    return Object.keys(errors).length > 0 ? errors : null;
  };

  const handleSave = async () => {
    const errors = validate();
    if (errors) return;
    const ok = await create({ ...fieldForm, model_id: modelId });
    if (ok) {
      setFieldForm({ name: '', technicalName: '', type: 'char', required: false, uniqueField: false, relationModel: '', relationField: '' });
      setFieldErrors({});
      reload();
    }
  };

  const handleCancel = () => {
    setFieldForm({ name: '', technicalName: '', type: 'char', required: false, uniqueField: false, relationModel: '', relationField: '' });
    setFieldErrors({});
  };

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.sectionTitle}>Campos del modelo</Text>
      {loading && <Text style={styles.info}>Cargando campos...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={{ marginBottom: 10 }}>
        {fields.length === 0 && <Text style={{ color: '#888', fontStyle: 'italic' }}>No hay campos definidos.</Text>}
        {fields.map((field) => (
          <View key={field.id} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 2 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 15 }}>
              {field.name}
              {field.required && <Text style={{ color: '#FF3333', fontSize: 16 }}> *</Text>}
            </Text>
            <Text style={{ color: Colors.light.icon, marginLeft: 6 }}>({field.technicalName})</Text>
            <Text style={{ color: Colors.light.primary, marginLeft: 6 }}>{field.type}</Text>
            <Text style={{ color: '#666', marginLeft: 10 }}>
              | Único: {field.uniqueField ? 'Sí' : 'No'}
              {field.type === 'relation' && ` | Rel: ${field.relationModel} → ${field.relationField}`}
            </Text>
          </View>
        ))}
      </View>
      {editable && (
        <View style={styles.fieldBox}>
          <Text style={styles.label}>Añadir nuevo campo</Text>
          <TextInput style={[styles.input, fieldErrors.name && styles.inputError]} value={fieldForm.name} onChangeText={v => setFieldForm(f => ({ ...f, name: v }))} placeholder="Nombre" />
          {fieldErrors.name && <Text style={styles.error}>{fieldErrors.name}</Text>}
          <TextInput style={[styles.input, fieldErrors.technicalName && styles.inputError]} value={fieldForm.technicalName} onChangeText={v => setFieldForm(f => ({ ...f, technicalName: v }))} placeholder="Nombre técnico" autoCapitalize="none" />
          {fieldErrors.technicalName && <Text style={styles.error}>{fieldErrors.technicalName}</Text>}
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.pickerRow}>
            {FIELD_TYPES.map(opt => (
              <TouchableOpacity key={opt.value} style={[styles.typeOption, fieldForm.type === opt.value && styles.typeOptionSelected]} onPress={() => setFieldForm(f => ({ ...f, type: opt.value }))}>
                <Text style={{ color: fieldForm.type === opt.value ? Colors.light.primary : '#444' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.switchRow}>
            <Text>Requerido</Text>
            <Switch value={!!fieldForm.required} onValueChange={v => setFieldForm(f => ({ ...f, required: v }))} />
            <Text style={{ marginLeft: 16 }}>Único</Text>
            <Switch value={!!fieldForm.uniqueField} onValueChange={v => setFieldForm(f => ({ ...f, uniqueField: v }))} />
          </View>
          {fieldForm.type === 'relation' && (
            <>
              <Text style={styles.label}>Modelo relacionado</Text>
              <TextInput style={styles.input} value={fieldForm.relationModel} onChangeText={v => setFieldForm(f => ({ ...f, relationModel: v }))} />
              <Text style={styles.label}>Campo relación</Text>
              <TextInput style={styles.input} value={fieldForm.relationField} onChangeText={v => setFieldForm(f => ({ ...f, relationField: v }))} />
            </>
          )}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: Colors.light.primary }]} onPress={handleSave} disabled={loadingCreate}>
              <Text style={styles.buttonText}>{loadingCreate ? 'Creando...' : 'Crear campo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]} onPress={handleCancel}>
              <Text style={[styles.buttonText, { color: '#222' }]}>Descartar</Text>
            </TouchableOpacity>
          </View>
          {errorCreate && <Text style={styles.error}>{errorCreate}</Text>}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 10,
  },
  fieldBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 6,
    gap: 8,
  },
  typeOption: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  typeOptionSelected: {
    backgroundColor: Colors.light.primary + '22',
    borderColor: Colors.light.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  button: {
    marginTop: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#FF6B6B',
    marginTop: 6,
    marginBottom: 4,
  },
  info: {
    color: Colors.light.icon,
    marginBottom: 8,
  },
});

export default ModelFieldsEditor;
