import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Bloquea eliminar un módulo si tiene dependencias
interface BlockDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  relatedModules: Array<{
    moduleId: number;
    moduleName: string;
    modelName: string;
    fieldName: string;
    fieldType: string;
  }>;
  onDeleteBoth?: () => void;
  showDeleteBoth?: boolean;
  type?: 'module' | 'model'; // Distinguir el contexto
}

export const BlockDeleteModal: React.FC<BlockDeleteModalProps> = ({ visible, onClose, relatedModules, onDeleteBoth, showDeleteBoth, type = 'module' }) => {
  const [confirm, setConfirm] = useState(false);
  const handleDeleteBoth = () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setConfirm(false);
    if (onDeleteBoth) onDeleteBoth();
  };
  
  // Resetear confirmación al cerrar el modal
  React.useEffect(() => { if (!visible) setConfirm(false); }, [visible]);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 32, width: 500, maxWidth: '98%', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24, color: '#c0392b', marginBottom: 16, letterSpacing: 0.2 }}>
            {type === 'model' ? 'No se puede eliminar el modelo' : 'No se puede eliminar el módulo'}
          </Text>
          <Text style={{ marginBottom: 18, color: '#333', fontSize: 16, lineHeight: 22 }}>
            {type === 'model'
              ? <>Este modelo tiene <Text style={{ fontWeight: 'bold', color: '#c0392b' }}>dependencias activas</Text> desde otros modelos o módulos. Para poder eliminarlo, primero elimina o modifica los siguientes campos relacionales:</>
              : <>Este módulo tiene <Text style={{ fontWeight: 'bold', color: '#c0392b' }}>dependencias activas</Text> desde otros módulos. Para poder eliminarlo, primero elimina o modifica los siguientes campos relacionales:</>
            }
          </Text>
          
          <ScrollView style={{ maxHeight: 320, marginBottom: 18 }}>
            {relatedModules.map((rel, idx) => (
              <View key={idx} style={{ marginBottom: 14, padding: 14, backgroundColor: '#f8eaea', borderRadius: 10, borderLeftWidth: 5, borderLeftColor: '#c0392b', shadowColor: '#c0392b', shadowOpacity: 0.08, shadowRadius: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    onPress={() => {
                      router.push({ pathname: '/module-editor', params: { moduleId: rel.moduleId } });
                      onClose();
                    }}
                    activeOpacity={0.7}
                    style={{ flex: 1 }}
                  >
                    <Text style={{ fontWeight: 'bold', color: '#7B61FF', fontSize: 17, marginBottom: 2, textDecorationLine: 'underline' }}>{rel.moduleName}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      router.push({ pathname: '/module-editor', params: { moduleId: rel.moduleId } });
                      onClose();
                    }}
                    activeOpacity={0.7}
                    style={{ paddingLeft: 10 }}
                  >
                    <Ionicons name="create-outline" size={28} color="#7B61FF" />
                  </TouchableOpacity>
                </View>
                
                <Text style={{ color: '#555', fontSize: 15 }}>Modelo: <Text style={{ fontWeight: 'bold', color: '#222' }}>{rel.modelName}</Text></Text>
                <Text style={{ color: '#c0392b', fontWeight: 'bold', fontSize: 15, marginTop: 2 }}>Campo relacional: <Text style={{ textDecorationLine: 'underline', color: '#c0392b' }}>{rel.fieldName}</Text> <Text style={{ color: '#2196F3' }}>({rel.fieldType})</Text></Text>
              </View>
            ))}
          
          </ScrollView>
          <View style={{ flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {showDeleteBoth && (
              <TouchableOpacity
                onPress={handleDeleteBoth}
                style={{
                  marginTop: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  borderRadius: 10,
                  minWidth: 260,
                  backgroundColor: confirm ? '#a93226' : '#c0392b',
                  opacity: 1,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17, textAlign: 'center', letterSpacing: 0.2 }}>
                  {confirm
                    ? '¿Estás seguro?'
                    : type === 'model'
                      ? 'Eliminar ambos modelos'
                      : 'Eliminar ambos módulos'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={onClose} style={{ marginTop: 2, paddingVertical: 10, paddingHorizontal: 32, backgroundColor: '#bbb', borderRadius: 10, minWidth: 260 }}>
              <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 17, textAlign: 'center' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
