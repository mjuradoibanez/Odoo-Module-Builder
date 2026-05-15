import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Picker } from '@react-native-picker/picker';
import { ODOO_STANDARD_MODELS } from '@/constants/odooStandardModels';
import { useModelFields } from '@/presentation/hooks/useModelFields';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Componente para editar un modelo y sus campos

// Tipos de campo disponibles
const FIELD_TYPES = [
  { label: 'Texto', value: 'char' },
  { label: 'Entero', value: 'integer' },
  { label: 'Decimal', value: 'float' },
  { label: 'Booleano', value: 'boolean' },
  { label: 'Fecha+Hora', value: 'datetime' },
  { label: 'Selección', value: 'selection' },
  { label: 'Relación', value: 'relation' },
];

// Helper para obtener la regla "computed" de un field
const getComputedRule = (rules: any[] | undefined | null): any | null => {
  if (!rules) return null;
  return rules.find(r => r.type === 'computed') || null;
};

// Helper para actualizar/quitar la regla "computed" en un array de rules
const setComputedRule = (rules: any[] | undefined | null, computedData: any | null): any[] => {
  const base = (rules || []).filter(r => r.type !== 'computed');
  if (computedData) {
    return [...base, computedData];
  }
  return base;
};

// Subtipos de relación
const RELATION_SUBTYPES = [
  { label: 'Muchos a uno', value: 'many2one' },
  { label: 'Uno a muchos', value: 'one2many' },
  { label: 'Muchos a muchos', value: 'many2many' },
];

// Obtiene el nombre completo del modelo (módulo.n_técnico o solo n_técnico)
const getFullModelName = (m: any) => {
  if (!m) return '';
  if (m.module && m.module.technicalName) return `${m.module.technicalName}.${m.technicalName}`;
  return m.technicalName;
};

// Estado inicial
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
  rules: [] as { type: string; value: any; label: string }[],
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

  // Validar reglas/constraints
  if (field.rules && field.rules.length > 0) {
    const ruleErrors: string[] = [];
    
    field.rules.forEach((rule: any, index: number) => {
      const ruleType = rule.type;
      const ruleValue = rule.value;

      // Reglas que requieren valor numérico
      if (['number_min', 'number_max', 'warn_num_less', 'warn_num_greater', 'char_min_len', 'char_max_len', 'warn_date_soon'].includes(ruleType)) {
        if (ruleValue === '' || ruleValue === null || ruleValue === undefined || isNaN(Number(ruleValue))) {
          ruleErrors.push(`Regla #${index + 1}: "${rule.label}" requiere un valor numérico válido`);
        }
      }

      // Reglas que requieren un campo de referencia (Picker)
      if (['date_after_field', 'date_before_field'].includes(ruleType)) {
        if (!ruleValue || ruleValue.toString().trim() === '') {
          ruleErrors.push(`Regla #${index + 1}: "${rule.label}" requiere seleccionar un campo`);
        }
      }

      // Reglas que requieren un valor de selección (clave)
      if (['warn_sel_is'].includes(ruleType)) {
        if (!ruleValue || ruleValue.toString().trim() === '') {
          ruleErrors.push(`Regla #${index + 1}: "${rule.label}" requiere un valor de selección`);
        }
      }

      // Reglas que requieren una fecha fija
      if (['date_after_fixed', 'date_before_fixed'].includes(ruleType)) {
        if (!ruleValue || ruleValue.toString().trim() === '') {
          ruleErrors.push(`Regla #${index + 1}: "${rule.label}" requiere una fecha válida`);
        }
      }
    });

    if (ruleErrors.length > 0) {
      errors.rules = ruleErrors;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
};


const FieldForm = ({
  form,
  setForm,
  errors,
  touched,
  setTouched,
  allFields = [],
}: {
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
  errors: any;
  touched: boolean;
  setTouched: Dispatch<SetStateAction<boolean>>;
  allFields?: any[];
}) => {
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);

  // Detecta cambios en cualquier campo
  useEffect(() => {
    setTouched(true);
  }, [form]);

  // Sincronización controlada por foco para campos nombre y opciones del select
  const [syncTechName, setSyncTechName] = useState(false);
  const [syncName, setSyncName] = useState(false);
  const [syncOptLabel, setSyncOptLabel] = useState(false);
  const [syncOptKey, setSyncOptKey] = useState(false);

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

  // Sincronización: clave - etiqueta (convierte guiones bajos a espacios y capitaliza)
  useEffect(() => {
    if (syncOptLabel && form._newOptKey) {
      const label = form._newOptKey
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      setForm((prev: any) => ({ ...prev, _newOptLabel: label }));
    }
  }, [form._newOptKey, syncOptLabel]);

  // Sincronización: etiqueta - clave (convierte espacios a guiones bajos y minúsculas)
  useEffect(() => {
    if (syncOptKey && form._newOptLabel) {
      const key = form._newOptLabel
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      setForm((prev: any) => ({ ...prev, _newOptKey: key }));
    }
  }, [form._newOptLabel, syncOptKey]);

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
      <Text style={[styles.label, { color: colors.text }]}>Nombre</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, errors.name && styles.inputError]}
        value={form.name}
        onChangeText={(v) => setForm((f: any) => ({ ...f, name: v }))}
        onFocus={() => {
          if (isNew && !form.technicalName) setSyncTechName(true);
        }}
        onBlur={() => setSyncTechName(false)}
      />
      {errors.name && <Text style={styles.error}>{errors.name}</Text>}

      <Text style={[styles.label, { color: colors.text }]}>Nombre técnico</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, errors.technicalName && styles.inputError]}
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

      <Text style={[styles.label, { color: colors.text }]}>Tipo</Text>
      <View style={styles.pickerRow}>
        {FIELD_TYPES.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.typeOption,
              { borderColor: colors.border },
              form.type === opt.value && [styles.typeOptionSelected, { backgroundColor: colors.primary }],
            ]}
            onPress={() =>
              setForm((f: any) => ({ ...f, type: opt.value, defaultValue: '' }))
            }
          >
            <Text
              style={{
                color:
                  form.type === opt.value
                    ? '#fff'
                    : colors.icon,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={{ color: colors.text }}>Requerido</Text>
        <Switch
          value={!!form.required}
          onValueChange={(v) =>
            setForm((f: any) => ({ ...f, required: v }))
          }
        />

        <Text style={{ marginLeft: 16, color: colors.text }}>Único</Text>
        <Switch
          value={!!form.uniqueField}
          onValueChange={(v) =>
            setForm((f: any) => ({ ...f, uniqueField: v }))
          }
        />
      </View>

      {/* VALOR POR DEFECTO */}
      {form.type !== 'relation' && form.type !== 'selection' && !(form.type === 'integer' && getComputedRule(form.rules)) && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.label, { color: colors.text }]}>Valor por defecto</Text>
          
          {form.type === 'boolean' ? (
            <View style={[styles.switchRow, { marginTop: 4 }]}>
              <Text style={{ color: colors.text }}>{form.defaultValue === 'true' ? 'Activado (True)' : 'Desactivado (False)'}</Text>
              <Switch
                value={form.defaultValue === 'true'}
                onValueChange={(v) =>
                  setForm((f: any) => ({ ...f, defaultValue: v ? 'true' : 'false' }))
                }
              />
            </View>

          ) : form.type === 'integer' || form.type === 'float' ? (
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={form.defaultValue}
              placeholder={form.type === 'integer' ? 'Ej: 123' : 'Ej: 3.14'}
              keyboardType={form.type === 'float' ? 'decimal-pad' : 'numeric'}
              onChangeText={(v) => {
                // Solo permitir números válidos
                if (form.type === 'integer') {
                  if (/^-?\d*$/.test(v)) setForm((f: any) => ({ ...f, defaultValue: v }));
                } else { // Convertir coma a punto para decimales
                  if (/^-?\d*(\.|,)?\d*$/.test(v)) setForm((f: any) => ({ ...f, defaultValue: v.replace(',', '.') }));
                }
              }}
            />

          ) : form.type === 'datetime' ? ( // Calendario para elegir fecha por defecto
            <div style={{ marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <ReactDatePicker
                  selected={form.defaultValue && form.defaultValue !== '__now__' ? new Date(form.defaultValue) : null}
                  onChange={(date: Date | null) => {
                    setForm((f: any) => ({ ...f, defaultValue: date ? date.toISOString() : '' }));
                  }}
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm:ss"
                  placeholderText="AAAA-MM-DD HH:mm:ss"
                  className="react-datepicker__input-text"
                  popperPlacement='top'
                />
                <TouchableOpacity
                  onPress={() => {
                    setForm((f: any) => ({
                      ...f,
                      defaultValue: f.defaultValue === '__now__' ? '' : '__now__',
                    }));
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: form.defaultValue === '__now__' ? '#4CAF50' : (isDarkMode ? '#555' : '#e0e0e0'),
                  }}
                >
                  <Text style={{ color: form.defaultValue === '__now__' ? '#fff' : (isDarkMode ? '#fff' : '#333'), fontWeight: '600', fontSize: 13 }}>
                    Hoy
                  </Text>
                </TouchableOpacity>
              </View>
              {form.defaultValue === '__now__' && (
                <Text style={{ color: '#4CAF50', fontSize: 12, fontStyle: 'italic' }}>
                  Se generará como: default=lambda self: fields.Datetime.now()
                </Text>
              )}
            </div>

          ) : ( // Input de texto para otros tipos
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
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
        <View style={{ marginTop: 12, padding: 10, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
          <Text style={[styles.label, { fontWeight: 'bold' }]}>Opciones de selección</Text>

          {(form.selectionOptions || []).map((opt: any, index: number) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ flex: 1, color: colors.text }}>{`${opt.key}: ${opt.label}`}</Text>
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
              style={[styles.input, { flex: 1, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, form._newOptKeyError && styles.inputError]}
              placeholder="Clave (ej: 0)"
              value={form._newOptKey || ''}
              onChangeText={(v) => {
                // Solo permitir minúsculas, números y guiones bajos (snake_case)
                const filtered = v.toLowerCase().replace(/[^a-z0-9_]/g, '');
                // Validar formato
                let error = '';
                if (filtered && !/^[a-z0-9_]+$/.test(filtered)) {
                  error = 'Solo minúsculas, números y _';
                }
                if (filtered && (filtered.startsWith('_') || filtered.endsWith('_'))) {
                  error = 'No puede empezar/terminar con _';
                }
                // Comprobar unicidad
                if (filtered && (form.selectionOptions || []).some((opt: any) => opt.key === filtered)) {
                  error = 'Esta clave ya existe';
                }
                setForm((f: any) => ({ ...f, _newOptKey: filtered, _newOptKeyError: error }));
              }}
              onFocus={() => {
                if (!form._newOptLabel) setSyncOptLabel(true);
              }}
              onBlur={() => setSyncOptLabel(false)}
            />
            <TextInput
              style={[styles.input, { flex: 2, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Etiqueta (ej: Bajo)"
              value={form._newOptLabel || ''}
              onChangeText={(v) => setForm((f: any) => ({ ...f, _newOptLabel: v }))}
              onFocus={() => {
                if (!form._newOptKey) setSyncOptKey(true);
              }}
              onBlur={() => setSyncOptKey(false)}
            />
            
            <TouchableOpacity
              style={{
                backgroundColor: form._newOptKey && form._newOptLabel && !form._newOptKeyError ? colors.primary : colors.border,
                padding: 10, borderRadius: 6, justifyContent: 'center'
              }}
              disabled={!form._newOptKey || !form._newOptLabel || !!form._newOptKeyError}
              onPress={() => {
                if (!form._newOptKey || !form._newOptLabel || form._newOptKeyError) return;
                const newOpts = [...(form.selectionOptions || []), { key: form._newOptKey, label: form._newOptLabel }];
                setForm((f: any) => ({ ...f, selectionOptions: newOpts, _newOptKey: '', _newOptLabel: '', _newOptKeyError: '' }));
              }}
            >
              <Text style={{ color: '#fff' }}>+</Text>
            </TouchableOpacity>
          </View>
          {form._newOptKeyError && (
            <Text style={[styles.error, { marginTop: 4 }]}>{form._newOptKeyError}</Text>
          )}

          <Text style={[styles.label, { marginTop: 16, color: colors.text }]}>Valor por defecto</Text>
          <View style={[styles.input, { padding: 0, backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              style={{ color: colors.text }}
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

      {/* GESTIÓN DE REGLAS DE NEGOCIO */}
      {['integer', 'float', 'date', 'char', 'selection'].includes(form.type) && (
        <View style={{ marginTop: 12, padding: 10, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
          <Text style={[styles.label, { fontWeight: 'bold', color: colors.text }]}>Validaciones y Reglas</Text>
          
          {(form.rules || []).map((rule: any, index: number) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ flex: 1, color: colors.text }}>{`• ${rule.label} ${rule.value || ''}`}</Text>
              {rule.type !== 'computed' ? (
                <TouchableOpacity onPress={() => {
                  const newRules = [...form.rules];
                  newRules.splice(index, 1);
                  setForm((f: any) => ({ ...f, rules: newRules }));
                }}>
                  <Text style={{ color: 'red', marginLeft: 10 }}>Eliminar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => {
                  const newRules = setComputedRule(form.rules, null);
                  setForm((f: any) => ({ ...f, rules: newRules }));
                }}>
                  <Text style={{ color: 'red', marginLeft: 10 }}>Desactivar</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Mostrar errores de validación de reglas */}
          {errors.rules && errors.rules.length > 0 && (
            <View style={{ marginTop: 6 }}>
              {errors.rules.map((err: string, i: number) => (
                <Text key={i} style={styles.error}>{err}</Text>
              ))}
            </View>
          )}

          {/* Configuración de nuevas reglas */}
          <View style={{ marginTop: 10, borderTopWidth: 1, borderColor: colors.border, paddingTop: 10 }}>
            <Text style={{ fontSize: 12, color: colors.icon }}>Añadir nueva regla:</Text>
            <View style={[styles.input, { padding: 0, marginTop: 4, backgroundColor: colors.background, borderColor: colors.border }]}>
              <Picker
                style={{ color: colors.text }}
                selectedValue=""
                onValueChange={(type) => {
                  if (!type) return;
                  
                  // Si ya existe una regla computed, no permitir anadir otra
                  if (type === 'computed' && getComputedRule(form.rules)) return;

                  let label = "";
                  let value: any = "";
                  
                  if (type === 'number_min') label = "Valor mínimo";
                  if (type === 'number_max') label = "Valor máximo";
                  if (type === 'date_no_future') label = "No permitir fechas futuras";
                  if (type === 'date_no_past') label = "No permitir fechas pasadas";
                  if (type === 'date_after_field') label = "Posterior al campo";
                  if (type === 'date_before_field') label = "Anterior al campo";
                  if (type === 'char_min_len') label = "Longitud mínima";
                  if (type === 'char_max_len') label = "Longitud máxima";
                  if (type === 'warn_sel_is') label = "Aviso si se selecciona";

                  if (type === 'computed') {
                    // Anadir regla computed con valores por defecto
                    const methodName = `_compute_${form.technicalName || 'field'}`;
                    const newRules = setComputedRule(form.rules, {
                      type: 'computed',
                      computeMethod: methodName,
                      depends: [],
                      store: true,
                      label: 'Campo computado',
                    });
                    setForm((f: any) => ({ ...f, rules: newRules, defaultValue: '' }));
                  } else {
                    const newRule = { type, value, label };
                    setForm((f: any) => ({ ...f, rules: [...(f.rules || []), newRule] }));
                  }
                }}
              >
                <Picker.Item label="Selecciona una validación..." value="" />
                {(form.type === 'integer' || form.type === 'float') && (
                  <>
                    <Picker.Item label="Valor mínimo (>= X)" value="number_min" />
                    <Picker.Item label="Valor máximo (<= X)" value="number_max" />
                    {form.type === 'integer' && (
                      <Picker.Item label="Campo computado" value="computed" />
                    )}
                  </>
                )}
                {form.type === 'date' && (
                  <>
                    <Picker.Item label="Prevenir fechas futuras" value="date_no_future" />
                    <Picker.Item label="Prevenir fechas pasadas" value="date_no_past" />
                    <Picker.Item label="Después de otro campo..." value="date_after_field" />
                    <Picker.Item label="Antes de otro campo..." value="date_before_field" />
                  </>
                )}
                {form.type === 'char' && (
                  <>
                    <Picker.Item label="Longitud mínima de caracteres" value="char_min_len" />
                    <Picker.Item label="Longitud máxima de caracteres" value="char_max_len" />
                  </>
                )}
                {form.type === 'selection' && (
                  <>
                    <Picker.Item label="Aviso si se selecciona una opción..." value="warn_sel_is" />
                  </>
                )}
              </Picker>
            </View>
          </View>

          {/* Configuración de valores para las reglas añadidas */}
          {(form.rules || []).map((rule: any, index: number) => {
            if (['date_no_future', 'date_no_past'].includes(rule.type)) return null; // Reglas sin valor adicional
            return (
              <View key={index} style={{ marginTop: 8, padding: 6, backgroundColor: colors.background, borderRadius: 4 }}>
                <Text style={{ fontSize: 12, color: colors.text }}>Configura {rule.label}:</Text>
                
                {rule.type === 'computed' ? (
                  <View style={{ gap: 8 }}>
                    <View>
                      <Text style={[styles.label, { color: colors.text }]}>Metodo compute</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        value={rule.computeMethod || ''}
                        placeholder="Ej: _compute_total_pedidos"
                        autoCapitalize="none"
                        onChangeText={(v) => {
                          const newRules = [...form.rules];
                          newRules[index] = { ...newRules[index], computeMethod: v };
                          setForm((f: any) => ({ ...f, rules: newRules }));
                        }}
                      />
                    </View>

                    <View>
                      <Text style={[styles.label, { color: colors.text }]}>Campo del que depende (one2many/many2many)</Text>
                      <View style={[styles.input, { padding: 0, backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Picker
                          style={{ color: colors.text }}
                          selectedValue={(rule.depends || [])[0] || ''}
                          onValueChange={(v) => {
                            const newRules = [...form.rules];
                            const newDepends = v ? [v] : [];
                            newRules[index] = { ...newRules[index], depends: newDepends };
                            setForm((f: any) => ({ ...f, rules: newRules }));
                          }}
                        >
                          <Picker.Item label="Selecciona campo..." value="" />
                          {(allFields || [])
                            .filter((f: any) => f.technicalName !== form.technicalName && (f.type === 'one2many' || f.type === 'many2many' || f.type === 'relation'))
                            .map((f: any) => (
                              <Picker.Item key={f.technicalName} label={`${f.name || f.technicalName} (${f.technicalName})`} value={f.technicalName} />
                            ))}
                        </Picker>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.icon, marginTop: 2 }}>Selecciona el campo de relación (one2many/many2many) para contar sus registros</Text>
                    </View>

                    <View style={styles.switchRow}>
                      <Text style={{ color: colors.text }}>Almacenar en BD (store=True)</Text>
                      <Switch
                        value={rule.store !== false}
                        onValueChange={(v) => {
                          const newRules = [...form.rules];
                          newRules[index] = { ...newRules[index], store: v };
                          setForm((f: any) => ({ ...f, rules: newRules }));
                        }}
                      />
                    </View>
                  </View>
                  
                ) : rule.type.includes('field') ? (
                  <View style={[styles.input, { padding: 0, backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Picker
                      style={{ color: colors.text }}
                      selectedValue={rule.value}
                      onValueChange={(v) => {
                         const newRules = [...form.rules];
                         newRules[index].value = v;
                         setForm((f: any) => ({ ...f, rules: newRules }));
                      }}
                    >
                      <Picker.Item label="Selecciona campo..." value="" />
                      {allFields
                         ? allFields.filter((f: any) => f.type === 'date' && f.technicalName !== form.technicalName).map((f: any) => (
                             <Picker.Item key={f.technicalName} label={f.name || f.technicalName} value={f.technicalName} />
                           ))
                         : null
                      }
                    </Picker>
                  </View>
                  
                ) : rule.type === 'warn_sel_is' ? (
                  <View style={[styles.input, { padding: 0, backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Picker
                      style={{ color: colors.text }}
                      selectedValue={rule.value}
                      onValueChange={(v) => {
                         const newRules = [...form.rules];
                         newRules[index].value = v;
                         setForm((f: any) => ({ ...f, rules: newRules }));
                      }}
                    >
                      <Picker.Item label="Selecciona opción a vigilar..." value="" />
                      {(form.selectionOptions || []).map((opt: any) => (
                        <Picker.Item key={opt.key} label={opt.label} value={opt.key} />
                      ))}
                    </Picker>
                  </View>
                  
                ) : (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Valor"
                    keyboardType={['number_min', 'number_max'].includes(rule.type) ? 'decimal-pad' : (['char_min_len', 'char_max_len'].includes(rule.type) ? 'numeric' : (['warn_num_less', 'warn_num_greater'].includes(rule.type) ? 'decimal-pad' : 'default'))}
                    value={String(rule.value || '')}
                    onChangeText={(v) => {
                      const newRules = [...form.rules];
                      // Validación numérica para reglas que requieren números
                      if (['number_min', 'number_max'].includes(rule.type)) {
                        // Permitir decimales (convertir coma a punto)
                        if (/^-?\d*(\.|,)?\d*$/.test(v)) {
                          newRules[index].value = v.replace(',', '.');
                          setForm((f: any) => ({ ...f, rules: newRules }));
                        }
                      } else if (['char_min_len', 'char_max_len'].includes(rule.type)) {
                        if (/^-?\d*$/.test(v)) {
                          newRules[index].value = v;
                          setForm((f: any) => ({ ...f, rules: newRules }));
                        }
                      } else if (rule.type === 'warn_num_less' || rule.type === 'warn_num_greater') {
                        // Permitir decimales (convertir coma a punto)
                        if (/^-?\d*(\.|,)?\d*$/.test(v)) {
                          newRules[index].value = v.replace(',', '.');
                          setForm((f: any) => ({ ...f, rules: newRules }));
                        }
                      } else {
                        newRules[index].value = v;
                        setForm((f: any) => ({ ...f, rules: newRules }));
                      }
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Campos extra solo si es relación */}
      {form.type === 'relation' && (
        <View>
          <Text style={[styles.label, { color: colors.text }]}>Tipo de relación</Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {RELATION_SUBTYPES.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.typeOption,
                  { borderColor: colors.border },
                  form.relationSubtype === opt.value &&
                  [styles.typeOptionSelected, { backgroundColor: colors.primary }],
                ]}
                onPress={() =>
                  setForm((f: any) => ({
                    ...f,
                    relationSubtype: opt.value,
                  }))
                }
              >
                <Text style={{ color: form.relationSubtype === opt.value ? '#fff' : colors.text }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Modelo relacionado</Text>
          <View style={[styles.input, { padding: 0, backgroundColor: colors.background, borderColor: colors.border }]}>
            <Picker
              style={{ color: colors.text }}
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
              <Text style={[styles.label, { color: colors.text }]}>Campo relación</Text>
              <View style={[styles.input, { padding: 0, backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                  style={{ color: colors.text }}
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

  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);

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
      selectionOptions: fieldToProcess.type === 'selection' ? fieldToProcess.selectionOptions : null,
      rules: fieldToProcess.rules || []
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
      rules: field.rules || [],
    });

    setTouched(false);
    setErrors({});
  };

  const getFieldKey = (field: any) => {
    return (field.id !== undefined && field.id !== null) ? field.id : field.technicalName;
  };

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Campos</Text>

      {/* LISTADO DE CAMPOS */}
      {fields.length === 0 && (
        <Text style={{ color: colors.icon, fontStyle: 'italic' }}>No hay campos definidos.</Text>
      )}

      {fields.map((field: any) => (
        <View key={field.id || field.technicalName} style={[styles.fieldRow, { borderColor: colors.border }]}>
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
                  allFields={fields}
                />
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSaveEdit}>
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingVertical: 4 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15, color: colors.text }}>
                  {field.name}
                  {field.required ? <Text style={{ color: '#FF3333', fontSize: 16 }}> *</Text> : null}
                </Text>
                <Text style={{ color: colors.icon, marginLeft: 6 }}>{`(${field.technicalName})`}</Text>
                <Text style={{ color: colors.primary, marginLeft: 6 }}>{field.type}</Text>
                {field.defaultValue && (
                  <Text style={{ color: '#27ae60', marginLeft: 6 }}>{`[Def: ${field.defaultValue}]`}</Text>
                )}
                {field.rules && field.rules.length > 0 && (
                  <Text style={{ color: '#f39c12', marginLeft: 6 }}>{`[Reglas: ${field.rules.length}]`}</Text>
                )}
                <Text style={{ color: colors.icon, marginLeft: 10 }}>{`| Único: ${field.uniqueField ? 'Sí' : 'No'}${field.type === 'relation' ? ` | Rel: ${field.relationModel} → ${field.relationField}` : ''}`}</Text>
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
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: 'center',
          }}
          onPress={() => setShowNewFieldForm(true)}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>+ Añadir campo</Text>
        </TouchableOpacity>
      )}

      {editable && showNewFieldForm && (
        <View style={[styles.fieldBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FieldForm
            form={newForm}
            setForm={setNewForm}
            errors={errors}
            touched={touched}
            setTouched={setTouched}
            allFields={fields}
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleAdd}>
            <Text style={styles.buttonText}>Añadir campo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary, marginTop: 6 }]} onPress={() => setShowNewFieldForm(false)}>
            <Text style={[styles.buttonText, { color: colors.primary }]}>Cancelar</Text>
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
  },

  fieldBox: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
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
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  button: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
  },

  buttonText: { color: '#fff', textAlign: 'center' },

  error: { color: 'red' },
});