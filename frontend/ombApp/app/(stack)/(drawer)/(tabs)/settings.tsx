import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useUpdateUser } from '@/presentation/hooks/useUpdateUser';
import { deleteAccount } from '@/core/actions/delete-account';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';

// Apartado del formulario (para hacer secciones)
const SettingsSection = ({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof getColors> }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.accent }]}>{title}</Text>
    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>{children}</View>
  </View>
);

// Opción de configuración con switch
const SettingSwitch = ({
  icon,
  label,
  description,
  value,
  onValueChange,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  colors: ReturnType<typeof getColors>;
}) => (
  <View style={styles.settingRow}>
    <View style={[styles.settingIconContainer, { backgroundColor: colors.background }]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>

    <View style={styles.settingTextContainer}>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      {description && <Text style={[styles.settingDescription, { color: colors.icon }]}>{description}</Text>}
    </View>
    
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.icon, true: colors.accent }}
      thumbColor={value ? colors.primary : '#f4f3f4'}
    />
  </View>
);

// Opción de configuración con navegación o acción
const SettingAction = ({
  icon,
  label,
  description,
  onPress,
  rightText,
  danger = false,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  rightText?: string;
  danger?: boolean;
  colors: ReturnType<typeof getColors>;
}) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.6}>
    <View style={[styles.settingIconContainer, { backgroundColor: colors.background }]}>
      <Ionicons name={icon} size={22} color={danger ? '#e74c3c' : colors.primary} />
    </View>

    <View style={styles.settingTextContainer}>
      <Text style={[styles.settingLabel, danger && { color: '#e74c3c' }, !danger && { color: colors.text }]}>{label}</Text>
      {description && <Text style={[styles.settingDescription, { color: colors.icon }]}>{description}</Text>}
    </View>
    
    {rightText && <Text style={[styles.settingRightText, { color: colors.icon }]}>{rightText}</Text>}
    
    <Ionicons name="chevron-forward" size={18} color={colors.icon} />
  </TouchableOpacity>
);

// Modal para cambiar contraseña
const ChangePasswordModal = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  serverError,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isSubmitting: boolean;
  serverError: string | null;
  colors: ReturnType<typeof getColors>;
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estados para mostrar/ocultar cada campo
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Mostrar error del servidor cuando llega
  const displayError = serverError || error;

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (!currentPassword) {
      setError('Introduce tu contraseña actual');
      return;
    }
    if (!newPassword) {
      setError('Introduce la nueva contraseña');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    const result = await onSubmit(currentPassword, newPassword);
    if (result) {
      setSuccess(true);
      // Cerrar el modal automáticamente después de 1.5 segundos
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  // Componente de input con ojo
  const PasswordField = ({
    label,
    value,
    onChangeText,
    placeholder,
    showPassword,
    onToggleShow,
    autoFocus,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    showPassword: boolean;
    onToggleShow: () => void;
    autoFocus?: boolean;
  }) => (
    <>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.passwordInputContainer, { backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.passwordInput, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          placeholder={placeholder}
          placeholderTextColor={colors.icon}
          autoFocus={autoFocus}
        />
        
        <TouchableOpacity onPress={onToggleShow} style={styles.eyeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.icon}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>Cambiar contraseña</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={styles.modalSuccess}>
              <Ionicons name="checkmark-circle" size={48} color="#27ae60" />
              <Text style={styles.modalSuccessText}>Contraseña actualizada correctamente</Text>
            </View>
          ) : (
            <>
              {displayError && (
                <View style={styles.modalError}>
                  <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                  <Text style={styles.modalErrorText}>{displayError}</Text>
                </View>
              )}

              <PasswordField
                label="Contraseña actual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Tu contraseña actual"
                showPassword={showCurrent}
                onToggleShow={() => setShowCurrent(!showCurrent)}
                autoFocus
              />

              <PasswordField
                label="Nueva contraseña"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mínimo 6 caracteres"
                showPassword={showNew}
                onToggleShow={() => setShowNew(!showNew)}
              />

              <PasswordField
                label="Confirmar nueva contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite la nueva contraseña"
                showPassword={showConfirm}
                onToggleShow={() => setShowConfirm(!showConfirm)}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.modalCancelText, { color: colors.icon }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitButton, { backgroundColor: colors.primary }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Modal para eliminar cuenta
const DeleteAccountModal = ({
  visible,
  onClose,
  onConfirm,
  deleting,
  error,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting?: boolean;
  error?: string | null;
  colors: ReturnType<typeof getColors>;
}) => {
  const [confirmStep, setConfirmStep] = useState(false);

  const handlePress = () => {
    if (deleting) return;
    if (!confirmStep) {
      setConfirmStep(true);
    } else {
      setConfirmStep(false);
      onConfirm();
    }
  };

  const handleClose = () => {
    if (deleting) return;
    setConfirmStep(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.deleteModalHeader}>
            <Ionicons name="warning-outline" size={48} color="#e74c3c" />
            <Text style={styles.deleteModalTitle}>Eliminar cuenta</Text>
          </View>

          <View style={styles.deleteModalBody}>
            <Text style={[styles.deleteModalText, { color: colors.text }]}>
              Esta acción es irreversible. Se eliminarán todos tus datos, incluyendo{' '}
              <Text style={styles.deleteModalHighlight}>todos tus módulos y proyectos</Text>.
            </Text>
          </View>

          {error && (
            <View style={styles.modalError}>
              <Ionicons name="alert-circle" size={16} color="#e74c3c" />
              <Text style={styles.modalErrorText}>{error}</Text>
            </View>
          )}

          <View style={styles.deleteModalActions}>
            <TouchableOpacity
              style={[styles.deleteButton, confirmStep && styles.deleteButtonConfirm]}
              onPress={handlePress}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>
                  {confirmStep ? '¿Seguro?' : 'Eliminar cuenta'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteCancelButton, { backgroundColor: colors.background }]}
              onPress={handleClose}
              disabled={deleting}
            >
              <Text style={[styles.deleteCancelText, { color: colors.icon }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Pantalla principal de ajustes
export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const user = useAuthStore((state) => state.user);
  const { update, isUpdating, error: updateError } = useUpdateUser();

  // Theme store
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);
  const colors = getColors(isDarkMode);

  // Estado para edición de username
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Estado para modal de cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Estado para modal de eliminar cuenta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const startEditingUsername = () => {
    setUsernameDraft(user?.username || '');
    setUsernameError(null);
    setEditingUsername(true);
  };

  const cancelEditingUsername = () => {
    setEditingUsername(false);
    setUsernameDraft('');
    setUsernameError(null);
  };

  const saveUsername = async () => {
    if (!user?.id) return;
    setUsernameError(null);
    const trimmed = usernameDraft.trim();
    if (!trimmed) {
      setUsernameError('El nombre de usuario no puede estar vacío');
      return;
    }

    const updatedUser = await update(user.id, { username: trimmed });
    if (updatedUser) {
      useAuthStore.setState({ user: updatedUser });
      setEditingUsername(false);
      setUsernameError(null);
    } else if (updateError) {
      setUsernameError(updateError);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user?.id) return false;

    const updatedUser = await update(user.id, {
      currentPassword,
      password: newPassword,
    });

    return !!updatedUser;
  };

  const openPasswordModal = () => {
    setShowPasswordModal(true);
  };

  const handleDeleteAccount = () => {
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user?.id) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount(user.id);
      await useAuthStore.getState().logout();
      // El layout redirigirá automáticamente a /auth/login porque el estado pasa a 'unauthenticated'
    } catch (error: any) {
      const message =
        error?.response?.data ||
        error?.message ||
        'Error al eliminar la cuenta. Inténtalo de nuevo.';
      setDeleteError(typeof message === 'string' ? message : 'Error al eliminar la cuenta');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const memberSince = formatDate(user?.createdAt);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, isDesktop && styles.containerDesktop]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Encabezado */}
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Ajustes</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>Configura tu experiencia en la aplicación</Text>

        {/* Tarjeta de perfil */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={64} color={colors.primary} />
          </View>

          <View style={styles.profileInfo}>
            {editingUsername ? (
              <View>
                <View style={styles.usernameEditContainer}>
                  <TextInput
                    style={[styles.usernameInput, { color: colors.primary, borderBottomColor: colors.accent }]}
                    value={usernameDraft}
                    onChangeText={(text) => {
                      setUsernameDraft(text);
                      if (usernameError) setUsernameError(null);
                    }}
                    autoFocus
                    placeholder="Tu nombre de usuario"
                    placeholderTextColor={colors.icon}
                    maxLength={50}
                  />

                  <View style={styles.usernameEditActions}>
                    <TouchableOpacity onPress={saveUsername} disabled={isUpdating}>
                      {isUpdating ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={cancelEditingUsername}>
                      <Ionicons name="close-circle" size={28} color={colors.icon} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {usernameError && (
                  <View style={styles.usernameErrorContainer}>
                    <Ionicons name="alert-circle" size={14} color="#e74c3c" />
                    <Text style={styles.usernameErrorText}>{usernameError}</Text>
                  </View>
                )}
              </View>

            ) : (
              <TouchableOpacity onPress={startEditingUsername} style={styles.usernameRow}>
                <Text style={[styles.profileName, { color: colors.primary }]}>{user?.username || 'Usuario'}</Text>
                <Ionicons name="pencil" size={16} color={colors.icon} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            )}

            <Text style={[styles.profileEmail, { color: colors.icon }]}>{user?.email || 'Sin correo'}</Text>
            {memberSince && (
              <Text style={[styles.profileDate, { color: colors.icon }]}>Miembro desde {memberSince}</Text>
            )}
          </View>
        </View>

        {/* Preferencias de la aplicación */}
        <SettingsSection title="Preferencias" colors={colors}>
          <SettingSwitch
            icon="moon-outline"
            label="Modo oscuro"
            description="Cambia la apariencia de la aplicación"
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            colors={colors}
          />
          <View style={[styles.separator, { backgroundColor: colors.background }]} />

          {/*<SettingAction
            icon="language-outline"
            label="Idioma"
            description="Idioma de la aplicación"
            onPress={() => {}}
            rightText="Español"
            colors={colors}
          />*/}
        </SettingsSection>

        {/* Cuenta */}
        <SettingsSection title="Cuenta" colors={colors}>
          <SettingAction
            icon="lock-closed-outline"
            label="Cambiar contraseña"
            description="Actualiza tu contraseña de acceso"
            onPress={openPasswordModal}
            colors={colors}
          />
          <View style={[styles.separator, { backgroundColor: colors.background }]} />

          <SettingAction
            icon="trash-outline"
            label="Eliminar cuenta"
            description="Elimina tu cuenta y todos tus datos"
            onPress={handleDeleteAccount}
            danger
            colors={colors}
          />
        </SettingsSection>

        {/* Información de la aplicación */}
        <SettingsSection title="Información" colors={colors}>
          <SettingAction
            icon="information-circle-outline"
            label="Versión"
            description="Versión actual de la aplicación"
            onPress={() => {}}
            rightText="1.0.0"
            colors={colors}
          />
          <View style={[styles.separator, { backgroundColor: colors.background }]} />

          <SettingAction
            icon="document-text-outline"
            label="Términos y condiciones"
            onPress={() => {}}
            colors={colors}
          />
          <View style={[styles.separator, { backgroundColor: colors.background }]} />

          <SettingAction
            icon="shield-checkmark-outline"
            label="Política de privacidad"
            onPress={() => {}}
            colors={colors}
          />
        </SettingsSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
        isSubmitting={isUpdating}
        serverError={updateError}
        colors={colors}
      />

      {/* Modal de eliminar cuenta */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteError(null);
        }}
        onConfirm={confirmDeleteAccount}
        deleting={isDeleting}
        error={deleteError}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerDesktop: {
    paddingLeft: 80,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  // Tarjeta de perfil
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  profileDate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Edición de username
  usernameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    paddingVertical: 2,
  },
  usernameEditActions: {
    flexDirection: 'row',
    gap: 4,
  },
  usernameErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  usernameErrorText: {
    color: '#e74c3c',
    fontSize: 13,
  },
  // Secciones
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    elevation: 2,
  },
  // Filas de configuración
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  settingRightText: {
    fontSize: 13,
    marginRight: 8,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  // Modal de cambio de contraseña
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde8e8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  modalErrorText: {
    color: '#e74c3c',
    fontSize: 14,
    flex: 1,
  },
  modalSuccess: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  modalSuccessText: {
    color: '#27ae60',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteModalHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  deleteModalBody: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  deleteModalHighlight: {
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  deleteModalActions: {
    gap: 10,
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
  },
  deleteButtonConfirm: {
    backgroundColor: '#c0392b',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteCancelButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSubmitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
});
