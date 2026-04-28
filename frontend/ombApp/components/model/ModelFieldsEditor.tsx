import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Colors } from '@/constants/theme';

// Tipos de campo disponibles
const FIELD_TYPES = [
  { label: 'Texto', value: 'char' },
  { label: 'Entero', value: 'integer' },
  { label: 'Decimal', value: 'float' },
  { label: 'Booleano', value: 'boolean' },
  { label: 'Fecha', value: 'date' },
  { label: 'Relación', value: 'relation' },
];

// Subtipos de relación
const RELATION_SUBTYPES = [
  { label: 'Muchos a uno', value: 'many2one' },
  { label: 'Uno a muchos', value: 'one2many' },
  { label: 'Muchos a muchos', value: 'many2many' },
];

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

  return Object.keys(errors).length ? errors : null;
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
    setForm: React.Dispatch<React.SetStateAction<any>>;
    errors: any;
    touched: boolean;
    setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
  // Detecta cambios en cualquier campo
  useEffect(() => {
    setTouched(true);
  }, [form]);

  return (
    <>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        value={form.name}
        onChangeText={(v) => setForm((f: any) => ({ ...f, name: v }))}
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
              setForm((f: any) => ({ ...f, type: opt.value }))
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
          <TextInput
            style={styles.input}
            value={form.relationModel}
            onChangeText={(v) =>
              setForm((f: any) => ({ ...f, relationModel: v }))
            }
          />

          <Text style={styles.label}>Campo relación</Text>
          <TextInput
            style={styles.input}
            value={form.relationField}
            onChangeText={(v) =>
              setForm((f: any) => ({ ...f, relationField: v }))
            }
          />
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
}: any) {

  const [newForm, setNewForm] = useState(INITIAL_FIELD);
  const [editForm, setEditForm] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState(false);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);

  const resetForm = () => {
    setNewForm(INITIAL_FIELD);
    setEditForm(null);
    setEditingId(null);
    setErrors({});
    setTouched(false);
    setShowNewFieldForm(false);
  };

  // Guardar nuevo campo
  const handleAdd = () => {
    const err = validateField(newForm);
    if (err) return setErrors(err);
    if (!touched) return;

    onAddField(newForm);
    resetForm();
  };

  // Guardar edición
  const handleSaveEdit = () => {
    const err = validateField(editForm);
    if (err) return setErrors(err);

    onEditField(editingId, editForm);
    resetForm();
  };

  // Activar edición
  const handleEdit = (field: any) => {
    setEditingId(field.id);
    setEditForm(field);
    setTouched(false);
    setErrors({});
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Campos</Text>
      {/* LISTADO DE CAMPOS */}
      {fields.length === 0 && (
        <Text style={{ color: '#888', fontStyle: 'italic' }}>No hay campos definidos.</Text>
      )}
      {fields.map((field: any) => (
        <TouchableOpacity
          key={field.id}
          onPress={() => editable && handleEdit(field)}
          onLongPress={() => editable && onDeleteField(field.id)}
          style={styles.fieldRow}
        >
          {editingId === field.id ? (
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
              <Text style={{ color: '#666', marginLeft: 10 }}>{`| Único: ${field.uniqueField ? 'Sí' : 'No'}${field.type === 'relation' ? ` | Rel: ${field.relationModel} → ${field.relationField}` : ''}`}</Text>
            </View>
          )}
        </TouchableOpacity>
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