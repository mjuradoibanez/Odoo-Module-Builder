import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';

// Componente para editar las vistas adicionales de un modelo (search, kanban, calendar, graph)

const VIEW_TYPES = [
  { label: 'Búsqueda (Search)', value: 'search' },
  { label: 'Kanban', value: 'kanban' },
  { label: 'Calendario', value: 'calendar' },
  { label: 'Gráfico', value: 'graph' },
];

const GRAPH_TYPES = [
  { label: 'Barras', value: 'bar' },
  { label: 'Lineas', value: 'line' },
  { label: 'Tarta', value: 'pie' },
];

export default function ModelViewsEditor({
  views = [],
  onAddView,
  onDeleteView,
  onUpdateView,
  modelFields = [],
  editable = true,
}: any) {
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [newView, setNewView] = useState({
    type: 'search',
    name: '',
    configuration: {} as any,
  });

  // Reiniciar formulario de nueva vista
  const resetForm = () => {
    setNewView({ type: 'search', name: '', configuration: {} });
    setFormErrors([]);
    setShowAddForm(false);
  };

  // Validar campos requeridos según el tipo de vista
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    const cfg = newView.configuration || {};

    switch (newView.type) {
      case 'search':
        if (!cfg.fields || cfg.fields.length === 0) {
          errors.push('Debes seleccionar al menos un campo de búsqueda.');
        }
        break;
      case 'calendar':
        if (!cfg.date_start) {
          errors.push('Debes seleccionar un campo de inicio para la vista de calendario.');
        }
        break;
      case 'graph':
        if (!cfg.row_field) {
          errors.push('Debes seleccionar un campo para "Agrupar por" (Row).');
        }
        if (!cfg.measure_field) {
          errors.push('Debes seleccionar un campo para "Medida" (Measure).');
        }
        break;
      // kanban no tiene campos obligatorios
    }
    return errors;
  };

  // Añadir nueva vista
  const handleAdd = () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors([]);
    const viewToAdd = {
      ...newView,
      name: newView.name || `${newView.type.charAt(0).toUpperCase() + newView.type.slice(1)} view`,
      id: -Math.floor(Math.random() * 100000), // Temp ID
    };
    onAddView(viewToAdd);
    resetForm();
  };

  // Actualizar vista
  const updateConfig = (key: string, value: any) => {
    setNewView(prev => ({
      ...prev,
      configuration: { ...prev.configuration, [key]: value }
    }));
  };

  // Renderizar campos específicos según tipo de vista
  const renderConfigFields = (view: any, isNew: boolean, updateFn: any) => {
    switch (view.type) {
      case 'search':
        return (
          <View>
            <Text style={[styles.label, { color: colors.text }]}>Campos de búsqueda</Text>
            <Text style={{ fontSize: 12, color: colors.icon, marginBottom: 4 }}>Selecciona los campos por los que se podrá buscar</Text>
            <View style={styles.fieldsContainer}>
                {modelFields.map((f: any) => {
                    const selected = (view.configuration.fields || []).includes(f.technicalName);
                    return (
                        <TouchableOpacity 
                            key={f.technicalName}
                            style={[
                              styles.fieldBadge,
                              { backgroundColor: colors.card, borderColor: colors.border },
                              selected && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                            onPress={() => {
                                const current = view.configuration.fields || [];
                                const next = selected ? current.filter((name: string) => name !== f.technicalName) : [...current, f.technicalName];
                                updateFn('fields', next);
                            }}
                        >
                            <Text style={[selected ? {color: '#fff'} : { color: colors.text }]}>{f.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
          </View>
        );

      case 'kanban':
        return (
          <View>
            <Text style={[styles.label, { color: colors.text }]}>Agrupar por defecto por:</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Picker
                    selectedValue={view.configuration.group_by}
                    onValueChange={(v) => updateFn('group_by', v)}
                    style={{ color: colors.text }}
                >
                    <Picker.Item label="Ninguno" value="" />
                    {modelFields.map((f: any) => (
                        <Picker.Item key={f.technicalName} label={f.name} value={f.technicalName} />
                    ))}
                </Picker>
            </View>
          </View>
        );

      case 'calendar':
        return (
          <View>
            <Text style={[styles.label, { color: colors.text }]}>Campo de inicio *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Picker
                    selectedValue={view.configuration.date_start}
                    onValueChange={(v) => updateFn('date_start', v)}
                    style={{ color: colors.text }}
                >
                    <Picker.Item label="Selecciona un campo..." value="" />
                    {modelFields.filter((f: any) => ['date', 'datetime'].includes(f.type.toLowerCase())).map((f: any) => (
                        <Picker.Item key={f.technicalName} label={f.name} value={f.technicalName} />
                    ))}
                </Picker>
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Campo de fin (opcional)</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Picker
                    selectedValue={view.configuration.date_stop}
                    onValueChange={(v) => updateFn('date_stop', v)}
                    style={{ color: colors.text }}
                >
                    <Picker.Item label="Ninguno" value="" />
                    {modelFields.filter((f: any) => ['date', 'datetime'].includes(f.type.toLowerCase())).map((f: any) => (
                        <Picker.Item key={f.technicalName} label={f.name} value={f.technicalName} />
                    ))}
                </Picker>
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Color (por campo)</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Picker
                    selectedValue={view.configuration.color}
                    onValueChange={(v) => updateFn('color', v)}
                    style={{ color: colors.text }}
                >
                    <Picker.Item label="Ninguno" value="" />
                    {modelFields.map((f: any) => (
                        <Picker.Item key={f.technicalName} label={f.name} value={f.technicalName} />
                    ))}
                </Picker>
            </View>
          </View>
        );

      case 'graph':
        return (
          <View>
            <Text style={[styles.label, { color: colors.text }]}>Tipo de gráfico</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Picker
                    selectedValue={view.configuration.graph_type}
                    onValueChange={(v) => updateFn('graph_type', v)}
                    style={{ color: colors.text }}
                >
                    {GRAPH_TYPES.map(gt => (
                        <Picker.Item key={gt.value} label={gt.label} value={gt.value} />
                    ))}
                </Picker>
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Agrupar por (Row)</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Picker
                    selectedValue={view.configuration.row_field}
                    onValueChange={(v) => updateFn('row_field', v)}
                    style={{ color: colors.text }}
                >
                    <Picker.Item label="Selecciona un campo..." value="" />
                    {modelFields.map((f: any) => (
                        <Picker.Item key={f.technicalName} label={f.name} value={f.technicalName} />
                    ))}
                </Picker>
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Medida (Measure)</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Picker
                    selectedValue={view.configuration.measure_field}
                    onValueChange={(v) => updateFn('measure_field', v)}
                    style={{ color: colors.text }}
                >
                    <Picker.Item label="Selecciona un campo..." value="" />
                    {modelFields.filter((f: any) => ['integer', 'float', 'monetary'].includes(f.type.toLowerCase())).map((f: any) => (
                        <Picker.Item key={f.technicalName} label={f.name} value={f.technicalName} />
                    ))}
                </Picker>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Vistas adicionales</Text>
      
      {views.length === 0 && !showAddForm && (
        <Text style={[styles.emptyText, { color: colors.icon }]}>No hay vistas adicionales configuradas.</Text>
      )}

      {views.map((view: any) => (
        <View key={view.id} style={[styles.viewRow, { borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            {/*  Resumen */}
            <Text style={[styles.viewName, { color: colors.text }]}>{view.name} <Text style={[styles.viewType, { color: colors.primary }]}>({view.type})</Text></Text>
          </View>
          {editable && (
            <TouchableOpacity onPress={() => onDeleteView(view.id)}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {editable && !showAddForm && (
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={() => setShowAddForm(true)}>
          <Text style={[styles.addButtonText, { color: colors.primary }]}>+ Añadir vista</Text>
        </TouchableOpacity>
      )}

      {showAddForm && (
        <View style={[styles.formBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Tipo de vista</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              selectedValue={newView.type}
              onValueChange={(v) => {
                let config = {};
                if (v === 'graph') config = { graph_type: 'bar' };
                if (v === 'calendar') config = {};
                if (v === 'search') config = { fields: [] };
                setNewView({ ...newView, type: v, configuration: config });
              }}
              style={{ color: colors.text }}
            >
              {VIEW_TYPES.map(vt => (
                <Picker.Item key={vt.value} label={vt.label} value={vt.value} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Nombre de la vista</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={newView.name}
            onChangeText={(v) => setNewView({ ...newView, name: v })}
            placeholder="Ej: Vista de análisis"
            placeholderTextColor={colors.icon}
          />

          {renderConfigFields(newView, true, updateConfig)}

          {formErrors.length > 0 && (
            <View style={{ marginTop: 12 }}>
              {formErrors.map((err, i) => (
                <Text key={i} style={{ color: '#c0392b', fontWeight: 'bold', fontSize: 14, marginBottom: i < formErrors.length - 1 ? 4 : 0 }}>{err}</Text>
              ))}
            </View>
          )}

          <View style={styles.formButtons}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleAdd}>
              <Text style={styles.buttonText}>Añadir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary }]} onPress={resetForm}>
              <Text style={[styles.buttonText, { color: colors.primary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { fontStyle: 'italic', marginBottom: 10 },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  viewName: { fontSize: 16, fontWeight: '500' },
  viewType: { fontSize: 14 },
  deleteText: { color: '#c0392b', fontWeight: 'bold' },
  addButton: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: { fontWeight: 'bold' },
  formBox: {
    marginTop: 15,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  label: { marginTop: 10, fontWeight: '500', marginBottom: 4 },
  input: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 4,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  fieldsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  fieldBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
  },
});
