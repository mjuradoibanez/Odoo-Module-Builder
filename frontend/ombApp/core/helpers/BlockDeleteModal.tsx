import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { blurActiveElement } from '@/core/helpers/blurActiveElement';

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
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);

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
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 32, width: 500, maxWidth: '98%', boxShadow: '0 0 16px rgba(0,0,0,0.18)', elevation: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 24, color: '#e74c3c', marginBottom: 16, letterSpacing: 0.2 }}>
            {type === 'model' ? 'No se puede eliminar el modelo' : 'No se puede eliminar el módulo'}
          </Text>
          <Text style={{ marginBottom: 18, color: colors.text, fontSize: 16, lineHeight: 22 }}>
            {type === 'model'
              ? <>Este modelo tiene <Text style={{ fontWeight: 'bold', color: '#e74c3c' }}>dependencias activas</Text> desde otros modelos o módulos. Para poder eliminarlo, primero elimina o modifica los siguientes campos relacionales:</>
              : <>Este módulo tiene <Text style={{ fontWeight: 'bold', color: '#e74c3c' }}>dependencias activas</Text> desde otros módulos. Para poder eliminarlo, primero elimina o modifica los siguientes campos relacionales:</>
            }
          </Text>
          
          <ScrollView style={{ maxHeight: 320, marginBottom: 18 }}>
            {relatedModules.map((rel, idx) => (
              <View key={idx} style={{ marginBottom: 14, padding: 14, backgroundColor: isDarkMode ? '#2A1A1A' : '#f8eaea', borderRadius: 10, borderLeftWidth: 5, borderLeftColor: '#e74c3c', boxShadow: '0 0 2px rgba(231,76,60,0.08)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    onPress={() => {
                      blurActiveElement();
                      router.push({ pathname: '/module-editor', params: { moduleId: rel.moduleId } });
                      onClose();
                    }}
                    activeOpacity={0.7}
                    style={{ flex: 1 }}
                  >
                    <Text style={{ fontWeight: 'bold', color: colors.primary, fontSize: 17, marginBottom: 2, textDecorationLine: 'underline' }}>{rel.moduleName}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      blurActiveElement();
                      router.push({ pathname: '/module-editor', params: { moduleId: rel.moduleId } });
                      onClose();
                    }}
                    activeOpacity={0.7}
                    style={{ paddingLeft: 10 }}
                  >
                    <Ionicons name="create-outline" size={28} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                
                <Text style={{ color: colors.icon, fontSize: 15 }}>Modelo: <Text style={{ fontWeight: 'bold', color: colors.text }}>{rel.modelName}</Text></Text>
                <Text style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 15, marginTop: 2 }}>Campo relacional: <Text style={{ textDecorationLine: 'underline', color: '#e74c3c' }}>{rel.fieldName}</Text> <Text style={{ color: '#2196F3' }}>({rel.fieldType})</Text></Text>
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
                  backgroundColor: confirm ? '#a93226' : '#e74c3c',
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
            
            <TouchableOpacity onPress={onClose} style={{ marginTop: 2, paddingVertical: 10, paddingHorizontal: 32, backgroundColor: colors.primary, borderRadius: 10, minWidth: 260 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17, textAlign: 'center' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
