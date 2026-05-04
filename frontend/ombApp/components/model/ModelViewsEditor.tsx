import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '@/constants/theme';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newView, setNewView] = useState({
    type: 'search',
    name: '',
    configuration: {} as any,
  });

  // Reiniciar formulario de nueva vista
  const resetForm = () => {
    setNewView({ type: 'search', name: '', configuration: {} });
    setShowAddForm(false);
  };

  // Añadir nueva vista
  const handleAdd = () => {
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
            <Text style={styles.label}>Campos de búsqueda</Text>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Selecciona los campos por los que se podrá buscar</Text>
            <View style={styles.fieldsContainer}>
                {modelFields.map((f: any) => {
                    const selected = (view.configuration.fields || []).includes(f.technicalName);
                    return (
                        <TouchableOpacity 
                            key={f.technicalName}
                            style={[styles.fieldBadge, selected && styles.fieldBadgeSelected]}
                            onPress={() => {
                                const current = view.configuration.fields || [];
                                const next = selected ? current.filter((name: string) => name !== f.technicalName) : [...current, f.technicalName];
                                updateFn('fields', next);
                            }}
                        >
                            <Text style={selected ? {color: '#fff'} : {}}>{f.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
          </View>
        );

      case 'kanban':
        return (
          <View>
            <Text style={styles.label}>Agrupar por defecto por:</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={view.configuration.group_by}
                    onValueChange={(v) => updateFn('group_by', v)}
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
            <Text style={styles.label}>Campo de inicio (obligatorio)</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={view.configuration.date_start}
                    onValueChange={(v) => updateFn('date_start', v)}
                >
                    <Picker.Item label="Selecciona un campo..." value="" />
                    {modelFields.filter((f: any) => ['date', 'datetime'].includes(f.type.toLowerCase())).map((f: any) => (
                        <Picker.Item key={f.technicalName} label={f.name} value={f.technicalName} />
                    ))}
                </Picker>
            </View>
            <Text style={styles.label}>Campo de fin (opcional)</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={view.configuration.date_stop}
                    onValueChange={(v) => updateFn('date_stop', v)}
                >
                    <Picker.Item label="Ninguno" value="" />
                    {modelFields.filter((f: any) => ['date', 'datetime'].includes(f.type.toLowerCase())).map((f: any) => (
                        <Picker.Item key={f.technicalName} label={f.name} value={f.technicalName} />
                    ))}
                </Picker>
            </View>
            <Text style={styles.label}>Color (por campo)</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={view.configuration.color}
                    onValueChange={(v) => updateFn('color', v)}
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
            <Text style={styles.label}>Tipo de gráfico</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={view.configuration.graph_type}
                    onValueChange={(v) => updateFn('graph_type', v)}
                >
                    {GRAPH_TYPES.map(gt => (
                        <Picker.Item key={gt.value} label={gt.label} value={gt.value} />
                    ))}
                </Picker>
            </View>
            <Text style={styles.label}>Agrupar por (Row)</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={view.configuration.row_field}
                    onValueChange={(v) => updateFn('row_field', v)}
                >
                    <Picker.Item label="Selecciona un campo..." value="" />
                    {modelFields.map((f: any) => (
                        <Picker.Item key={f.technicalName} label={f.name} value={f.technicalName} />
                    ))}
                </Picker>
            </View>
            <Text style={styles.label}>Medida (Measure)</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={view.configuration.measure_field}
                    onValueChange={(v) => updateFn('measure_field', v)}
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
      <Text style={styles.sectionTitle}>Vistas adicionales</Text>
      
      {views.length === 0 && !showAddForm && (
        <Text style={styles.emptyText}>No hay vistas adicionales configuradas.</Text>
      )}

      {views.map((view: any) => (
        <View key={view.id} style={styles.viewRow}>
          <View style={{ flex: 1 }}>
            {/*  Resumen */}
            <Text style={styles.viewName}>{view.name} <Text style={styles.viewType}>({view.type})</Text></Text>
          </View>
          {editable && (
            <TouchableOpacity onPress={() => onDeleteView(view.id)}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {editable && !showAddForm && (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
          <Text style={styles.addButtonText}>+ Añadir vista</Text>
        </TouchableOpacity>
      )}

      {showAddForm && (
        <View style={styles.formBox}>
          <Text style={styles.label}>Tipo de vista</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newView.type}
              onValueChange={(v) => {
                let config = {};
                if (v === 'graph') config = { graph_type: 'bar' };
                if (v === 'calendar') config = { date_start: 'create_date' };
                if (v === 'search') config = { fields: [] };
                setNewView({ ...newView, type: v, configuration: config });
              }}
            >
              {VIEW_TYPES.map(vt => (
                <Picker.Item key={vt.value} label={vt.label} value={vt.value} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Nombre de la vista</Text>
          <TextInput
            style={styles.input}
            value={newView.name}
            onChangeText={(v) => setNewView({ ...newView, name: v })}
            placeholder="Ej: Vista de análisis"
          />

          {renderConfigFields(newView, true, updateConfig)}

          <View style={styles.formButtons}>
            <TouchableOpacity style={[styles.button, { backgroundColor: Colors.light.primary }]} onPress={handleAdd}>
              <Text style={styles.buttonText}>Añadir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#bbb' }]} onPress={resetForm}>
              <Text style={[styles.buttonText, { color: '#222' }]}>Cancelar</Text>
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
  emptyText: { color: '#888', fontStyle: 'italic', marginBottom: 10 },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  viewName: { fontSize: 16, fontWeight: '500' },
  viewType: { color: Colors.light.icon, fontSize: 14 },
  deleteText: { color: '#c0392b', fontWeight: 'bold' },
  addButton: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: { color: Colors.light.primary, fontWeight: 'bold' },
  formBox: {
    marginTop: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fdfdfd',
  },
  label: { marginTop: 10, fontWeight: '500', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
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
    borderColor: '#ccc',
    backgroundColor: '#eee',
  },
  fieldBadgeSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  }
});
