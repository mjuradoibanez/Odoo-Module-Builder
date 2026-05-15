import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVATAR_LIST, getAvatarSource } from '@/core/constants/avatars';
import { getColors } from '@/constants/theme';

// Componente para seleccioanr avatar

interface AvatarSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  currentAvatar: string | null | undefined;
  onSelect: (avatarName: string) => void;
  colors: ReturnType<typeof getColors>;
}

const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  visible,
  onClose,
  currentAvatar,
  onSelect,
  colors,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Cabecera */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Elige tu avatar</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
            Selecciona una imagen de perfil
          </Text>

          {/* Opción "Sin foto" */}
          <TouchableOpacity
            style={[
              styles.noPhotoOption,
              { borderColor: colors.border, backgroundColor: colors.background },
              !currentAvatar && [styles.noPhotoSelected, { borderColor: colors.primary }],
            ]}
            onPress={() => onSelect('')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={32} color={colors.icon} />
            <Text style={[styles.noPhotoText, { color: colors.icon }]}>Sin foto</Text>
            {!currentAvatar && (
              <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Cuadrícula de avatares */}
          <View style={styles.avatarGrid}>
            {AVATAR_LIST.map((avatarName) => {
              const isSelected = currentAvatar === avatarName;
              const source = getAvatarSource(avatarName);

              return (
                <TouchableOpacity
                  key={avatarName}
                  style={[
                    styles.avatarItem,
                    isSelected && [styles.avatarItemSelected, { borderColor: colors.primary }],
                  ]}
                  onPress={() => onSelect(avatarName)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={source}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón de cerrar */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: colors.icon }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: 340,
    maxWidth: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  noPhotoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 16,
  },
  noPhotoSelected: {
    borderWidth: 2,
  },
  noPhotoText: {
    fontSize: 15,
    fontWeight: '600',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatarItem: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarItemSelected: {
    borderWidth: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  closeButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AvatarSelectorModal;
