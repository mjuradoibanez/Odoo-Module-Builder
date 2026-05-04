import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Picker } from '@react-native-picker/picker';
import { ODOO_STANDARD_MODELS } from '@/constants/odooStandardModels';
import { useModelFields } from '@/presentation/hooks/useModelFields';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Colors } from '@/constants/theme';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Tipos de campo disponibles
const FIELD_TYPES = [
  { label: 'Texto', value: 'char' },
  { label: 'Entero', value: 'integer' },
  { label: 'Decimal', value: 'float' },
  { label: 'Booleano', value: 'boolean' },
  { label: 'Fecha', value: 'date' },
  { label: 'Selección', value: 'selection' },
  { label: 'Relación', value: 'relation' },
];

// Subtipos de relación
const RELATION_SUBTYPES = [
  { label: 'Muchos a uno', value: 'many2one' },
  { label: 'Uno a muchos', value: 'one2many' },
  { label: 'Muchos a muchos', value: 'many2many' },
];

//Obtiene el nombre completo del modelo (módulo.técnico o solo técnico)
const getFullModelName = (m: any) => {
  if (!m) return '';
  if (m.module && m.module.technicalName) return `${m.module.technicalName}.${m.technicalName}`;
  return m.technicalName;
};

// Estado inicial reutilizable
const INITIAL_FIELD = {
  name: '',
  technicalName: '',
  type: 'char',
  required: false,
  uniqueField: false,
  relationModel: '',
  relationField: '',
  relationSubtype: 'many2one',
  defaultValue: '',
  selectionOptions: [] as { key: string; label: string }[],
};

// VALIDACIÓN
const validateField = (field: any) => {
  const errors: any = {};

  if (!field.name.trim()) errors.name = 'El nombre es obligatorio';

  if (!field.technicalName.trim()) {
    errors.technicalName = 'El nombre técnico es obligatorio';
  } else if (!/^([a-z_]+)$/.test(field.technicalName)) {
    errors.technicalName = 'Solo minúsculas y guiones bajos';
  }

  if (!field.type) errors.type = 'El tipo es obligatorio';
  return Object.keys(errors).length > 0 ? errors : null;
};


// COMPONENTE FORM
const FieldForm = ({
  form,
  setForm,
  errors,
  touched,
  setTouched,
}: {
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
  errors: any;
  touched: boolean;
  setTouched: Dispatch<SetStateAction<boolean>>;
}) => {
  // Detecta cambios en cualquier campo
  useEffect(() => {
    setTouched(true);
  }, [form]);

  // Sincronización controlada por foco para campos
  const [syncTechName, setSyncTechName] = useState(false);
  const [syncName, setSyncName] = useState(false);

  // Es un campo nuevo si no tiene id o es negativo
  const isNew = !form.id || (typeof form.id === 'number' && form.id <= 0);

  useEffect(() => {
    if (isNew && syncTechName) {
      setForm((prev: any) => ({
        ...prev,
        technicalName: prev.name.toLowerCase().replace(/\s+/g, '_')
      }));
    }
  }, [form.name, isNew, syncTechName]);

  useEffect(() => {
    if (isNew && syncName) {
      setForm((prev: any) => ({
        ...prev,
        name: prev.technicalName
      }));
    }
  }, [form.technicalName, isNew, syncName]);

  // Hook para cargar los campos del modelo relacionado seleccionado
  let selectedOwnModelId: number | undefined = undefined;
  let selectedOwnModel: any = undefined;

  if (form.availableOwnModels && form.relationModel) {
    selectedOwnModel = form.availableOwnModels.find((m: any) => getFullModelName(m) === form.relationModel);
    selectedOwnModelId = selectedOwnModel?.id;
  }

  const { fields: apiFields, loading: loadingFields } = useModelFields(selectedOwnModelId);
  const relatedFields = (selectedOwnModel?.fields && selectedOwnModel.fields.length > 0) ? selectedOwnModel.fields : apiFields;

  // Si el campo de relación seleccionado ya no existe en el modelo destino, lo resetea
  useEffect(() => {
    if (!form.relationField || !relatedFields || loadingFields) return;

    const exists = relatedFields.some((f: any) => f.technicalName === form.relationField);
    if (!exists) {
      setForm((prev: any) => ({ ...prev, relationField: '' }));
    }
  }, [relatedFields, loadingFields]);

  return (
    <>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        value={form.name}
        onChangeText={(v) => setForm((f: any) => ({ ...f, name: v }))}
        onFocus={() => {
          if (isNew && !form.technicalName) setSyncTechName(true);
        }}
        onBlur={() => setSyncTechName(false)}
      />
      {errors.name && <Text style={styles.error}>{errors.name}</Text>}

      <Text style={styles.label}>Nombre técnico</Text>
      <TextInput
        style={[styles.input, errors.technicalName && styles.inputError]}
        value={form.technicalName}
        autoCapitalize="none"
        onChangeText={(v) =>
          setForm((f: any) => ({ ...f, technicalName: v }))
        }
        onFocus={() => {
          if (isNew && !form.name) setSyncName(true);
        }}
        onBlur={() => setSyncName(false)}
      />
      {errors.technicalName && (
        <Text style={styles.error}>{errors.technicalName}</Text>
      )}

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.pickerRow}>
        {FIELD_TYPES.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.typeOption,
              form.type === opt.value && styles.typeOptionSelected,
            ]}
            onPress={() =>
              setForm((f: any) => ({ ...f, type: opt.value, defaultValue: '' }))
            }
          >
            <Text
              style={{
                color:
                  form.type === opt.value
                    ? Colors.light.primary
                    : '#444',
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text>Requerido</Text>
        <Switch
          value={!!form.required}
          onValueChange={(v) =>
            setForm((f: any) => ({ ...f, required: v }))
          }
        />

        <Text style={{ marginLeft: 16 }}>Único</Text>
        <Switch
          value={!!form.uniqueField}
          onValueChange={(v) =>
            setForm((f: any) => ({ ...f, uniqueField: v }))
          }
        />
      </View>

      {/* VALOR POR DEFECTO */}
      {form.type !== 'relation' && form.type !== 'selection' && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.label}>Valor por defecto</Text>
          
          {form.type === 'boolean' ? (
            <View style={[styles.switchRow, { marginTop: 4 }]}>
              <Text>{form.defaultValue === 'true' ? 'Activado (True)' : 'Desactivado (False)'}</Text>
              <Switch
                value={form.defaultValue === 'true'}
                onValueChange={(v) =>
                  setForm((f: any) => ({ ...f, defaultValue: v ? 'true' : 'false' }))
                }
              />
            </View>

          ) : form.type === 'integer' || form.type === 'float' ? (
            <TextInput
              style={styles.input}
              value={form.defaultValue}
              placeholder={form.type === 'integer' ? 'Ej: 123' : 'Ej: 3.14'}
              keyboardType="numeric"
              onChangeText={(v) => {
                // Solo permitir números válidos
                if (form.type === 'integer') {
                  if (/^-?\d*$/.test(v)) setForm((f: any) => ({ ...f, defaultValue: v }));
                } else { // Convertir coma a punto para decimales
                  if (/^-?\d*(\.|,)?\d*$/.test(v)) setForm((f: any) => ({ ...f, defaultValue: v.replace(',', '.') }));
                }
              }}
            />

          ) : form.type === 'date' ? ( // Calendario para elegir fecha por defecto
            <div style={{ marginTop: 4 }}>
              <ReactDatePicker
                selected={form.defaultValue ? new Date(form.defaultValue) : null}
                onChange={(date: Date | null) => {
                  setForm((f: any) => ({ ...f, defaultValue: date ? date.toISOString().slice(0, 10) : '' }));
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="AAAA-MM-DD"
                className="react-datepicker__input-text"
                popperPlacement='top' // Se muestra encima del input
              />
            </div>

          ) : ( // Input de texto para otros tipos
            <TextInput
              style={styles.input}
              value={form.defaultValue}
              placeholder="Ingresa valor..."
              keyboardType="default"
              onChangeText={(v) => setForm((f: any) => ({ ...f, defaultValue: v }))}
            />
          )}
        </View>
      )}

      {/* GESTIÓN DE OPCIONES PARA SELECCIÓN */}
      {form.type === 'selection' && (
        <View style={{ marginTop: 12, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>Opciones de selección</Text>

          {(form.selectionOptions || []).map((opt: any, index: number) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ flex: 1 }}>{`${opt.key}: ${opt.label}`}</Text>
              <TouchableOpacity onPress={() => {
                const newOpts = [...form.selectionOptions];
                newOpts.splice(index, 1);
                setForm((f: any) => ({ ...f, selectionOptions: newOpts }));
              }}>
                <Text style={{ color: 'red', marginLeft: 10 }}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Clave (ej: 0)"
              value={form._newOptKey || ''}
              onChangeText={(v) => setForm((f: any) => ({ ...f, _newOptKey: v }))}
            />
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Etiqueta (ej: Bajo)"
              value={form._newOptLabel || ''}
              onChangeText={(v) => setForm((f: any) => ({ ...f, _newOptLabel: v }))}
            />
            
            <TouchableOpacity 
              style={{ backgroundColor: Colors.light.primary, padding: 10, borderRadius: 6, justifyContent: 'center' }}
              onPress={() => {
                if (!form._newOptKey || !form._newOptLabel) return;
                const newOpts = [...(form.selectionOptions || []), { key: form._newOptKey, label: form._newOptLabel }];
                setForm((f: any) => ({ ...f, selectionOptions: newOpts, _newOptKey: '', _newOptLabel: '' }));
              }}
            >
              <Text style={{ color: '#fff' }}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Valor por defecto</Text>
          <View style={[styles.input, { padding: 0 }]}>
            <Picker
              selectedValue={form.defaultValue}
              onValueChange={(v) => setForm((f: any) => ({ ...f, defaultValue: v }))}
            >
              <Picker.Item label="Selecciona valor por defecto..." value="" />
              {(form.selectionOptions || []).map((opt: any) => (
                <Picker.Item key={opt.key} label={opt.label} value={opt.key} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Campos extra solo si es relación */}
      {form.type === 'relation' && (
        <View>
          <Text style={styles.label}>Tipo de relación</Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {RELATION_SUBTYPES.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.typeOption,
                  form.relationSubtype === opt.value &&
                  styles.typeOptionSelected,
                ]}
                onPress={() =>
                  setForm((f: any) => ({
                    ...f,
                    relationSubtype: opt.value,
                  }))
                }
              >
                <Text>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Modelo relacionado</Text>
          <View style={[styles.input, { padding: 0 }]}>
            <Picker
              selectedValue={form.relationModel}
              onValueChange={(v) => setForm((f: any) => ({ ...f, relationModel: v, relationField: '' }))}
            >
              <Picker.Item label="Selecciona un modelo..." value="" />

              {/* Modelos propios (de la sesión) */}
              {form.availableOwnModels && form.availableOwnModels.length > 0 && (
                <Picker.Item label="--- Modelos propios ---" value="__own__" enabled={false} />
              )}
              {form.availableOwnModels && form.availableOwnModels.map((m: any) => (
                <Picker.Item
                  key={m.technicalName}
                  label={m.module && (m.module.name || m.module.technicalName) ? `${m.name} (${m.module.name || m.module.technicalName})` : m.name || m.technicalName}
                  value={getFullModelName(m)}
                />
              ))}

              {/* Modelos estándar Odoo */}
              <Picker.Item label="--- Modelos estándar Odoo ---" value="__odoo__" enabled={false} />
              {ODOO_STANDARD_MODELS.map((m) => (
                <Picker.Item key={m.technicalName} label={m.label} value={m.technicalName} />
              ))}
            </Picker>
          </View>

          {/* Selector de campo solo si el modelo destino es propio */}
          {form.availableOwnModels && form.availableOwnModels.some((m: any) => getFullModelName(m) === form.relationModel) && (
            <>
              <Text style={styles.label}>Campo relación</Text>
              <View style={[styles.input, { padding: 0 }]}>
                <Picker
                  selectedValue={form.relationField}
                  onValueChange={(v) => setForm((f: any) => ({ ...f, relationField: v }))}
                  enabled={!!form.relationModel && !loadingFields}
                >
                  <Picker.Item label={loadingFields ? 'Cargando campos...' : 'Selecciona un campo...'} value="" />
                  {relatedFields && relatedFields.map((f: any) => (
                    <Picker.Item key={f.technicalName} label={f.name || f.technicalName} value={f.technicalName} />
                  ))}
                </Picker>
              </View>
            </>
          )}
        </View>
      )}
    </>
  );
};

// COMPONENTE PRINCIPAL
export default function ModelFieldsEditor({
  fields,
  onAddField,
  onEditField,
  onDeleteField,
  editable,
  ownModels = [], // [{ technicalName, name }]
  onEditStateChange,
}: any) {

  const [newForm, setNewForm] = useState({ ...INITIAL_FIELD, availableOwnModels: ownModels });
  const [editForm, setEditForm] = useState<any>(null);

  const [editingId, setEditingId] = useState<any>(null);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState(false);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);

  // Notificar cambios de estado de edición al padre
  useEffect(() => {
    if (onEditStateChange) {
      onEditStateChange(editingId !== null || showNewFieldForm);
    }
  }, [editingId, showNewFieldForm, onEditStateChange]);

  // Sincroniza availableOwnModels en newForm y editForm cuando cambian los modelos propios
  useEffect(() => {
    setNewForm(f => ({ ...f, availableOwnModels: ownModels }));
    setEditForm((f: typeof editForm) => f ? { ...f, availableOwnModels: ownModels } : f);
  }, [ownModels]);

  const resetForm = () => {
    setNewForm({ ...INITIAL_FIELD, availableOwnModels: ownModels });
    setEditForm(null);
    setEditingId(null);
    setErrors({});
    setTouched(false);
    setShowNewFieldForm(false);
  };

  // Lógica para guardar campo (nuevo o editado)
  const saveField = (formData: any, callback: (idOrField: any, field?: any) => void, id?: number) => {
    const err = validateField(formData);
    if (err) return setErrors(err);
    if (!touched && !id) return; // Solo para nuevo campo

    const { availableOwnModels, ...fieldToProcess } = formData;

    let relationModule = undefined;

    // Si es modelo propio
    if (
      fieldToProcess.availableOwnModels &&
      fieldToProcess.relationModel &&
      fieldToProcess.availableOwnModels.some((m: any) => getFullModelName(m) === fieldToProcess.relationModel)
    ) {
      const ownModel = fieldToProcess.availableOwnModels.find((m: any) => getFullModelName(m) === fieldToProcess.relationModel);
      relationModule = ownModel?.module?.technicalName || '';
    }

    // Si es modelo estándar de Odoo
    if (!relationModule && fieldToProcess.relationModel) {
      const odooModel = ODOO_STANDARD_MODELS.find(m => m.technicalName === fieldToProcess.relationModel);
      relationModule = odooModel?.module || '';
    }

    let fieldToSave: any = {
      ...fieldToProcess,
      type: fieldToProcess.type === 'relation' ? fieldToProcess.relationSubtype : fieldToProcess.type,
      relationModel: fieldToProcess.relationModel,
      defaultValue: fieldToProcess.type === 'relation' ? null : fieldToProcess.defaultValue,
      selectionOptions: fieldToProcess.type === 'selection' ? fieldToProcess.selectionOptions : null
    };

    // Solo añadir relationModule si es relacional
    if (["many2one", "one2many", "many2many"].includes(fieldToSave.type) && relationModule) {
      fieldToSave.relationModule = relationModule;
    }

    if (id !== undefined && id !== null) {
      callback(id, fieldToSave);
    } else {
      callback(fieldToSave);
    }
    resetForm();
  };

  // Guardar nuevo campo
  const handleAdd = () => {
    saveField(newForm, onAddField);
  };

  // Guardar edición
  const handleSaveEdit = () => {
    saveField(editForm, onEditField, editingId === null ? undefined : editingId);
  };

  // Activar edición
  const handleEdit = (field: any) => {
    let parsedType = field.type;
    let relationSubtype = 'many2one';
    let relationModel = field.relationModel;
    let relationField = field.relationField || '';

    // Detectar si es relación
    if (["many2one", "one2many", "many2many"].includes(field.type)) {
      parsedType = "relation";
      relationSubtype = field.type;
    }

    setEditingId(field.id);
    setEditForm({
      ...field,
      type: parsedType,
      relationSubtype,
      relationModel,
      relationField,
      availableOwnModels: ownModels,
    });

    setTouched(false);
    setErrors({});
  };

  const getFieldKey = (field: any) => {
    return (field.id !== undefined && field.id !== null) ? field.id : field.technicalName;
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Campos</Text>

      {/* LISTADO DE CAMPOS */}
      {fields.length === 0 && (
        <Text style={{ color: '#888', fontStyle: 'italic' }}>No hay campos definidos.</Text>
      )}

      {fields.map((field: any) => (
        <View key={field.id || field.technicalName} style={styles.fieldRow}>
          <TouchableOpacity
            onPress={() => editable && editingId !== getFieldKey(field) && handleEdit(field)}
            style={{ flex: 1 }}
            disabled={editingId === getFieldKey(field)}
          >
            {editingId !== null && editingId === getFieldKey(field) ? (
              <>
                {/* FORMULARIO EDICIÓN */}
                <FieldForm
                  form={editForm}
                  setForm={setEditForm}
                  errors={errors}
                  touched={touched}
                  setTouched={setTouched}
                />
                <TouchableOpacity style={styles.button} onPress={handleSaveEdit}>
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingVertical: 4 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15 }}>
                  {field.name}
                  {field.required ? <Text style={{ color: '#FF3333', fontSize: 16 }}> *</Text> : null}
                </Text>
                <Text style={{ color: Colors.light.icon, marginLeft: 6 }}>{`(${field.technicalName})`}</Text>
                <Text style={{ color: Colors.light.primary, marginLeft: 6 }}>{field.type}</Text>
                {field.defaultValue && (
                  <Text style={{ color: '#27ae60', marginLeft: 6 }}>{`[Def: ${field.defaultValue}]`}</Text>
                )}
                <Text style={{ color: '#666', marginLeft: 10 }}>{`| Único: ${field.uniqueField ? 'Sí' : 'No'}${field.type === 'relation' ? ` | Rel: ${field.relationModel} → ${field.relationField}` : ''}`}</Text>
              </View>
            )}
          </TouchableOpacity>

          {editable && editingId !== field.id && (
            <TouchableOpacity
              onPress={() => onDeleteField(field.id)}
              style={{ marginLeft: 8, padding: 4 }}
            >
              <Text style={{ color: '#c0392b', fontWeight: 'bold' }}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* BOTÓN PARA MOSTRAR FORMULARIO DE NUEVO CAMPO */}
      {editable && !showNewFieldForm && (
        <TouchableOpacity
          style={{
            marginTop: 10,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: Colors.light.primary,
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: 'center',
          }}
          onPress={() => setShowNewFieldForm(true)}
        >
          <Text style={{ color: Colors.light.primary, fontWeight: 'bold', fontSize: 16 }}>+ Añadir campo</Text>
        </TouchableOpacity>
      )}

      {editable && showNewFieldForm && (
        <View style={styles.fieldBox}>
          <FieldForm
            form={newForm}
            setForm={setNewForm}
            errors={errors}
            touched={touched}
            setTouched={setTouched}
          />
          <TouchableOpacity style={styles.button} onPress={handleAdd}>
            <Text style={styles.buttonText}>Añadir campo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: '#bbb', marginTop: 6 }]} onPress={() => setShowNewFieldForm(false)}>
            <Text style={[styles.buttonText, { color: '#222' }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },

  fieldRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },

  fieldBox: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  label: { marginTop: 6 },

  input: {
    borderWidth: 1,
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },

  inputError: { borderColor: 'red' },

  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },

  typeOption: {
    padding: 6,
    borderWidth: 1,
    marginRight: 6,
    borderRadius: 4,
  },

  typeOptionSelected: {
    backgroundColor: '#ddd',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  button: {
    marginTop: 10,
    backgroundColor: Colors.light.primary,
    padding: 10,
    borderRadius: 6,
  },

  buttonText: { color: '#fff', textAlign: 'center' },

  error: { color: 'red' },
});