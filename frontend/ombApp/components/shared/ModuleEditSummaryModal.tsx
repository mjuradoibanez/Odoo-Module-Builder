import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';

// Interfaz para describir los cambios
interface ChangeSummary {
  type: 'new' | 'edit' | 'delete' | 'unchanged';
  label: string;
  value?: string;
  prevValue?: string;
}

// Interfaz para describir los datos de un modelo y su tipo de cambio
interface ModelSummary {
  id: number;
  name: string;
  technicalName: string;
  changeType: 'new' | 'edit' | 'delete' | 'unchanged';
  fields: Array<{
    id: number;
    name: string;
    technicalName: string;
    type: string;
    changeType: 'new' | 'edit' | 'delete' | 'unchanged';
  }>;
}

// Props del modal
interface ModuleEditSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDiscard?: () => void;
  moduleData: {
    name: ChangeSummary;
    technicalName: ChangeSummary;
    description: ChangeSummary;
    category: ChangeSummary;
    isPublic: ChangeSummary;
    models: ModelSummary[];
  };
  mode: 'save' | 'discard';
}

const colorForChange = (type: string) => {
  switch (type) {
    case 'new': return '#2ecc40';
    case 'edit': return '#f39c12';
    case 'delete': return '#c0392b';
    default: return '#222';
  }
};

export const ModuleEditSummaryModal: React.FC<ModuleEditSummaryModalProps> = ({ visible, onClose, onAccept, onDiscard, moduleData, mode }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 32, width: 600, maxWidth: '98%', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24, color: mode === 'discard' ? '#c0392b' : '#7B61FF', marginBottom: 16, letterSpacing: 0.2 }}>
            {mode === 'discard' ? 'Descartar cambios del módulo' : 'Resumen de cambios del módulo'}
          </Text>
          <ScrollView style={{ maxHeight: 420, marginBottom: 18 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Datos generales</Text>
            {(['name','technicalName','description','category','isPublic'] as const).map((key) => {
              const change = moduleData && moduleData[key];
              if (!change || typeof change !== 'object') {
                return (
                  <View key={key} style={{ marginBottom: 6 }}>
                    <Text style={{ color: '#aaa' }}>{key}: (Sin datos)</Text>
                  </View>
                );
              }
              return (
                <View key={key} style={{ marginBottom: 6 }}>
                  <Text style={{ color: colorForChange(change.type), fontWeight: change.type !== 'unchanged' ? 'bold' : 'normal' }}>
                    {change.label}: {change.value}
                    {change.type === 'edit' && (
                      <Text style={{ color: '#aaa', fontWeight: 'normal' }}> (antes: {change.prevValue})</Text>
                    )}
                  </Text>
                </View>
              );
            })}
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginVertical: 10 }}>Modelos</Text>
            {(!moduleData || !Array.isArray(moduleData.models) || moduleData.models.length === 0) && <Text style={{ color: '#aaa' }}>Sin modelos</Text>}
            {(Array.isArray(moduleData?.models) ? moduleData.models.filter(m => m && typeof m === 'object') : []).map(model => (
              <View key={model.id || model.technicalName} style={{ marginBottom: 12, padding: 10, borderRadius: 8, backgroundColor: model.changeType !== 'unchanged' ? '#f7f7f7' : undefined, borderLeftWidth: 5, borderLeftColor: colorForChange(model.changeType) }}>
                <Text style={{ fontWeight: 'bold', color: colorForChange(model.changeType), fontSize: 16 }}>{model?.name ?? '(Sin nombre)'} <Text style={{ color: '#888' }}>({model?.technicalName ?? '-'})</Text> {model?.changeType !== 'unchanged' && `[${model?.changeType === 'new' ? 'Nuevo' : model?.changeType === 'edit' ? 'Editado' : 'Eliminado'}]`}</Text>
                {Array.isArray(model.fields) && model.fields.filter(f => f && typeof f === 'object').length > 0 && (
                  <View style={{ marginLeft: 10, marginTop: 4 }}>
                    {model.fields.filter(f => f && typeof f === 'object').map(field => (
                      <Text key={field.id || field.technicalName} style={{ color: colorForChange(field.changeType), fontSize: 15 }}>
                        - {field?.name ?? '(Sin nombre)'} <Text style={{ color: '#888' }}>({field?.technicalName ?? '-'}, {field?.type ?? '-'})</Text> {field?.changeType !== 'unchanged' && `[${field?.changeType === 'new' ? 'Nuevo' : field?.changeType === 'edit' ? 'Editado' : 'Eliminado'}]`}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 18 }}>
            <TouchableOpacity style={{ backgroundColor: mode === 'discard' ? '#c0392b' : '#7B61FF', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', marginRight: 8 }} onPress={onAccept}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{mode === 'discard' ? 'Descartar cambios' : 'Aceptar y guardar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#bbb', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' }} onPress={onClose}>
              <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 18 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
