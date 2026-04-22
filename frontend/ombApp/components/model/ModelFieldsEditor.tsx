import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const RELATION_SUBTYPES = [
  { label: 'Muchos a uno (many2one)', value: 'many2one' },
  { label: 'Uno a muchos (one2many)', value: 'one2many' },
  { label: 'Muchos a muchos (many2many)', value: 'many2many' },
];

export function ModelFieldsEditor({ modelId, editable, onEditStateChange }: { modelId: number, editable: boolean, onEditStateChange?: (editing: boolean) => void }) {
  const { fields, loading, error, reload } = useFieldsOfModel(modelId);
  const { create, loading: loadingCreate, error: errorCreate } = useCreateField();
  const { update, loading: loadingUpdate, error: errorUpdate } = useUpdateField();
    const [fieldForm, setFieldForm] = useState({
      name: '',
      technicalName: '',
      type: 'char',
      required: false,
      uniqueField: false,
      relationModel: '',
      relationField: '',
      relationSubtype: 'many2one',
    });
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [fieldFormTouched, setFieldFormTouched] = useState(false);
  const [editFieldFormTouched, setEditFieldFormTouched] = useState(false);
  const [fieldFormError, setFieldFormError] = useState('');
  const [editFieldFormError, setEditFieldFormError] = useState('');
  const [editFieldForm, setEditFieldForm] = useState<any>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<any>({});

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
    if (!fieldFormTouched) {
      setFieldFormError('No hay cambios para guardar');
      return;
    }
    const ok = await create({ ...fieldForm, model_id: modelId });
    if (ok) {
      setFieldForm({ name: '', technicalName: '', type: 'char', required: false, uniqueField: false, relationModel: '', relationField: '', relationSubtype: 'many2one' });
      setFieldErrors({});
      setFieldFormTouched(false);
      setShowNewFieldForm(false);
      reload();
    } else {
      // Si la creación falla, mantener el formulario abierto
      setFieldFormTouched(true);
    }
  };

  const handleCancel = () => {
    setFieldForm({ name: '', technicalName: '', type: 'char', required: false, uniqueField: false, relationModel: '', relationField: '', relationSubtype: 'many2one' });
    setFieldErrors({});
  };

  // Validación para edición
  const validateEdit = () => {
    const errors: any = {};
    if (!editFieldForm.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!editFieldForm.technicalName.trim()) errors.technicalName = 'El nombre técnico es obligatorio';
    else if (!/^([a-z_]+)$/.test(editFieldForm.technicalName)) errors.technicalName = 'Solo minúsculas y guiones bajos';
    if (!editFieldForm.type) errors.type = 'El tipo es obligatorio';
    setEditFieldErrors(errors);
    return Object.keys(errors).length > 0 ? errors : null;
  };

  const handleEdit = (field: any) => {
    // Si está abierto el formulario de nuevo campo y tiene cambios, bloquear
    if (showNewFieldForm && fieldFormTouched && (fieldForm.name || fieldForm.technicalName)) {
      setFieldFormError('Termina o descarta el campo nuevo antes de editar otro campo.');
      return;
    }
    // Si está abierto el formulario de nuevo campo pero vacío, permitir
    if (showNewFieldForm) {
      setShowNewFieldForm(false);
      setFieldFormTouched(false);
      setFieldFormError('');
    }
    // Si hay edición de otro campo y tiene cambios, bloquear
    if (editingFieldId !== null && editFieldFormTouched && editFieldForm && (editFieldForm.name !== fields.find(f => f.id === editingFieldId)?.name || editFieldForm.technicalName !== fields.find(f => f.id === editingFieldId)?.technicalName || editFieldForm.type !== fields.find(f => f.id === editingFieldId)?.type)) {
      setEditFieldFormError('Termina o descarta la edición antes de editar otro campo.');
      return;
    }
    // Forzar que el tipo sea exactamente el string del chip si es relación
    setEditingFieldId(field.id);
    setEditFieldForm({
      name: field.name,
      technicalName: field.technicalName,
      type: field.type === 'relation' || field.type === 'many2one' || field.type === 'many2many' ? 'relation' : field.type,
      required: !!field.required,
      uniqueField: !!field.uniqueField,
      relationModel: field.relationModel || '',
      relationField: field.relationField || '',
      relationSubtype: field.type === 'many2one' || field.type === 'many2many' || field.type === 'one2many' ? field.type : 'many2one',
    });
    setEditFieldErrors({});
    setEditFieldFormTouched(false);
    setEditFieldFormError('');
    if (onEditStateChange) onEditStateChange(true);
  };

  const handleEditSave = async () => {
    const errors = validateEdit();
    if (errors) return;
    if (editingFieldId === null) return;
    if (!editFieldFormTouched) {
      setEditFieldFormError('No hay cambios para guardar');
      return;
    }
    const ok = await update(editingFieldId, { ...editFieldForm, model_id: modelId });
    if (ok) {
      setEditingFieldId(null);
      setEditFieldForm(null);
      setEditFieldErrors({});
      setEditFieldFormTouched(false);
      reload();
    }
  };

  const handleEditCancel = () => {
    setEditingFieldId(null);
    setEditFieldForm(null);
    setEditFieldErrors({});
    setEditFieldFormTouched(false);
    setEditFieldFormError('');
    if (onEditStateChange) onEditStateChange(false);
  };


  // Avisar al padre si se abre/cierra el formulario de nuevo campo
  React.useEffect(() => {
    if (onEditStateChange) onEditStateChange(showNewFieldForm);
    // Solo cuando cambia showNewFieldForm
  }, [showNewFieldForm]);

  // Detectar cambios en el formulario de nuevo campo
  React.useEffect(() => {
    setFieldFormTouched(
      !!fieldForm.name || !!fieldForm.technicalName || fieldForm.type !== 'char' || !!fieldForm.relationModel || !!fieldForm.relationField || !!fieldForm.required || !!fieldForm.uniqueField
    );
  }, [fieldForm]);

  // Detectar cambios en el formulario de edición de campo
  React.useEffect(() => {
    if (!editFieldForm || editingFieldId === null) {
      setEditFieldFormTouched(false);
      return;
    }
    const original = fields.find(f => f.id === editingFieldId);
    setEditFieldFormTouched(
      !!editFieldForm && (
        editFieldForm.name !== original?.name ||
        editFieldForm.technicalName !== original?.technicalName ||
        editFieldForm.type !== original?.type ||
        !!editFieldForm.relationModel !== !!original?.relationModel ||
        !!editFieldForm.relationField !== !!original?.relationField ||
        !!editFieldForm.required !== !!original?.required ||
        !!editFieldForm.uniqueField !== !!original?.uniqueField
      )
    );
  }, [editFieldForm, editingFieldId, fields]);

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.sectionTitle}>Campos del modelo</Text>
      {loading && <Text style={styles.info}>Cargando campos...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={{ marginBottom: 10 }}>
        {fields.length === 0 && <Text style={{ color: '#888', fontStyle: 'italic' }}>No hay campos definidos.</Text>}
        {fields.map((field) => (
          <TouchableOpacity
            key={field.id}
            style={[
              styles.fieldRow,
              editable && styles.fieldRowEditable,
              editingFieldId === field.id && styles.fieldRowActive,
              editFieldFormError && editingFieldId === field.id ? { borderColor: '#c0392b', borderWidth: 2 } : null,
            ]}
            activeOpacity={0.85}
            onPress={() => editable && handleEdit(field)}
            disabled={!editable}
          >
            {editingFieldId === field.id ? (
              <View style={[styles.fieldBox, { flex: 1, marginBottom: 0 }]}> 
                <Text style={styles.label}>Nombre</Text>
                <TextInput style={[styles.input, editFieldErrors.name && styles.inputError]} value={editFieldForm.name} onChangeText={v => { setEditFieldForm((f: any) => ({ ...f, name: v })); setEditFieldFormTouched(true); }} />
                {editFieldErrors.name ? <Text style={styles.error}>{editFieldErrors.name}</Text> : null}
                <Text style={styles.label}>Nombre técnico</Text>
                <TextInput style={[styles.input, editFieldErrors.technicalName && styles.inputError]} value={editFieldForm.technicalName} onChangeText={v => { setEditFieldForm((f: any) => ({ ...f, technicalName: v })); setEditFieldFormTouched(true); }} autoCapitalize="none" />
                {editFieldErrors.technicalName ? <Text style={styles.error}>{editFieldErrors.technicalName}</Text> : null}
                <Text style={styles.label}>Tipo</Text>
                <View style={styles.pickerRow}>
                  {FIELD_TYPES.map(opt => (
                    <TouchableOpacity key={opt.value} style={[styles.typeOption, editFieldForm.type === opt.value && styles.typeOptionSelected]} onPress={() => { setEditFieldForm((f: any) => ({ ...f, type: opt.value })); setEditFieldFormTouched(true); }}>
                      <Text style={{ color: editFieldForm.type === opt.value ? Colors.light.primary : '#444' }}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.switchRow}>
                  <Text>Requerido</Text>
                  <Switch value={!!editFieldForm.required} onValueChange={v => { setEditFieldForm((f: any) => ({ ...f, required: v })); setEditFieldFormTouched(true); }} />
                  <Text style={{ marginLeft: 16 }}>Único</Text>
                  <Switch value={!!editFieldForm.uniqueField} onValueChange={v => { setEditFieldForm((f: any) => ({ ...f, uniqueField: v })); setEditFieldFormTouched(true); }} />
                </View>
                {editFieldForm.type === 'relation' ? (
                  <View>
                    <Text style={styles.label}>Tipo de relación</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      {RELATION_SUBTYPES.map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.typeOption, editFieldForm.relationSubtype === opt.value && styles.typeOptionSelected]}
                          onPress={() => { setEditFieldForm((f: any) => ({ ...f, relationSubtype: opt.value })); setEditFieldFormTouched(true); }}
                        >
                          <Text style={{ color: editFieldForm.relationSubtype === opt.value ? Colors.light.primary : '#444' }}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.label}>Modelo relacionado</Text>
                    <TextInput style={styles.input} value={editFieldForm.relationModel} onChangeText={v => { setEditFieldForm((f: any) => ({ ...f, relationModel: v })); setEditFieldFormTouched(true); }} />
                    <Text style={styles.label}>Campo relación</Text>
                    <TextInput style={styles.input} value={editFieldForm.relationField} onChangeText={v => { setEditFieldForm((f: any) => ({ ...f, relationField: v })); setEditFieldFormTouched(true); }} />
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: Colors.light.primary }]} onPress={handleEditSave} disabled={loadingUpdate}>
                    <Text style={styles.buttonText}>{loadingUpdate ? 'Guardando...' : 'Guardar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]} onPress={handleEditCancel}>
                    <Text style={[styles.buttonText, { color: '#222' }]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
                {errorUpdate ? <Text style={styles.error}>{errorUpdate}</Text> : null}
                {editFieldFormError ? <Text style={[styles.error, { color: '#c0392b' }]}>{editFieldFormError}</Text> : null}
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingVertical: 4 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15 }}>
                  {field.name}
                  {field.required ? <Text style={{ color: '#FF3333', fontSize: 16 }}> *</Text> : null}
                </Text>
                <Text style={{ color: Colors.light.icon, marginLeft: 6 }}>{`(${field.technicalName})`}</Text>
                <Text style={{ color: Colors.light.primary, marginLeft: 6 }}>{field.type}</Text>
                <Text style={{ color: '#666', marginLeft: 10 }}>{`| Único: ${field.uniqueField ? 'Sí' : 'No'}${field.type === 'relation' ? ` | Rel: ${field.relationModel} → ${field.relationField}` : ''}`}</Text>
                {editable ? (
                  <Ionicons name="pencil" size={18} color={Colors.light.primary} style={{ marginLeft: 10, opacity: 0.7 }} />
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {/* Botón para mostrar formulario de nuevo campo */}
      {editable && !showNewFieldForm && (
        <TouchableOpacity
          style={[styles.addFieldButton, fieldFormError ? { borderColor: '#c0392b', borderWidth: 2 } : null]}
          onPress={() => {
            // Si hay edición de campo y tiene cambios, bloquear
            if (editingFieldId !== null && editFieldFormTouched && editFieldForm && (editFieldForm.name !== fields.find(f => f.id === editingFieldId)?.name || editFieldForm.technicalName !== fields.find(f => f.id === editingFieldId)?.technicalName || editFieldForm.type !== fields.find(f => f.id === editingFieldId)?.type)) {
              setEditFieldFormError('Termina o descarta la edición antes de crear un nuevo campo.');
              return;
            }
            // Si hay edición de campo pero sin cambios, permitir
            if (editingFieldId !== null) {
              setEditingFieldId(null);
              setEditFieldForm(null);
              setEditFieldErrors({});
              setEditFieldFormTouched(false);
              setEditFieldFormError('');
            }
            setShowNewFieldForm(true);
            setFieldFormError('');
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.addFieldButtonText}>Nuevo campo</Text>
        </TouchableOpacity>
      )}
      {editable && showNewFieldForm && fields && Array.isArray(fields) && (
        <View style={[styles.fieldBox, fieldFormError ? { borderColor: '#c0392b', borderWidth: 2 } : {}, { marginTop: 10 }]}> 
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={[styles.input, fieldErrors.name && styles.inputError]} value={fieldForm.name} onChangeText={v => { setFieldForm(f => ({ ...f, name: v })); setFieldFormTouched(true); }} placeholder="Nombre del campo" />
          {fieldErrors.name ? <Text style={styles.error}>{fieldErrors.name}</Text> : null}
          <Text style={styles.label}>Nombre técnico</Text>
          <TextInput style={[styles.input, fieldErrors.technicalName && styles.inputError]} value={fieldForm.technicalName} onChangeText={v => { setFieldForm(f => ({ ...f, technicalName: v })); setFieldFormTouched(true); }} placeholder="Nombre técnico" autoCapitalize="none" />
          {fieldErrors.technicalName ? <Text style={styles.error}>{fieldErrors.technicalName}</Text> : null}
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.pickerRow}>
            {FIELD_TYPES.map(opt => (
              <TouchableOpacity key={opt.value} style={[styles.typeOption, fieldForm.type === opt.value && styles.typeOptionSelected]} onPress={() => { setFieldForm(f => ({ ...f, type: opt.value })); setFieldFormTouched(true); }}>
                <Text style={{ color: fieldForm.type === opt.value ? Colors.light.primary : '#444' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.switchRow}>
            <Text>Requerido</Text>
            <Switch value={!!fieldForm.required} onValueChange={v => { setFieldForm(f => ({ ...f, required: v })); setFieldFormTouched(true); }} />
            <Text style={{ marginLeft: 16 }}>Único</Text>
            <Switch value={!!fieldForm.uniqueField} onValueChange={v => { setFieldForm(f => ({ ...f, uniqueField: v })); setFieldFormTouched(true); }} />
          </View>
          {fieldForm.type === 'relation' ? (
            <View>
              <Text style={styles.label}>Tipo de relación</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {RELATION_SUBTYPES.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.typeOption, fieldForm.relationSubtype === opt.value && styles.typeOptionSelected]}
                    onPress={() => { setFieldForm(f => ({ ...f, relationSubtype: opt.value })); setFieldFormTouched(true); }}
                  >
                    <Text style={{ color: fieldForm.relationSubtype === opt.value ? Colors.light.primary : '#444' }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Modelo relacionado</Text>
              <TextInput style={styles.input} value={fieldForm.relationModel} onChangeText={v => { setFieldForm(f => ({ ...f, relationModel: v })); setFieldFormTouched(true); }} />
              <Text style={styles.label}>Campo relación</Text>
              <TextInput style={styles.input} value={fieldForm.relationField} onChangeText={v => { setFieldForm(f => ({ ...f, relationField: v })); setFieldFormTouched(true); }} />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.button, { flex: 1, backgroundColor: Colors.light.primary }, !fieldFormTouched && { opacity: 0.5 }]}
              onPress={() => {
                if (!fieldFormTouched) {
                  setFieldFormError('No hay cambios para guardar');
                  return;
                }
                setFieldFormError(''); // Limpiar error anterior
                handleSave();
              }}
              disabled={loadingCreate}
            >
              <Text style={styles.buttonText}>{loadingCreate ? 'Creando...' : 'Crear campo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]} onPress={() => { setShowNewFieldForm(false); setFieldForm({ name: '', technicalName: '', type: 'char', required: false, uniqueField: false, relationModel: '', relationField: '', relationSubtype: 'many2one' }); setFieldErrors({}); setFieldFormTouched(false); setFieldFormError(''); }}>
              <Text style={[styles.buttonText, { color: '#222' }]}>Descartar</Text>
            </TouchableOpacity>
          </View>
          {fieldFormError ? (
            <Text style={{ color: '#c0392b', marginTop: 4, fontSize: 14, textAlign: 'left' }}>{fieldFormError}</Text>
          ) : null}
          {!fieldFormError && errorCreate ? <Text style={styles.error}>{errorCreate}</Text> : null}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  fieldRow: {
    borderRadius: 6,
    paddingHorizontal: 6,
    marginBottom: 2,
    transitionDuration: '0.2s',
  },
  fieldRowEditable: {
    cursor: 'pointer',
    backgroundColor: '#f7f7fa',
  },
  fieldRowActive: {
    backgroundColor: '#e6e6f7',
    borderColor: Colors.light.primary,
    borderWidth: 1,
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f0fa',
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  addFieldButtonText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
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
