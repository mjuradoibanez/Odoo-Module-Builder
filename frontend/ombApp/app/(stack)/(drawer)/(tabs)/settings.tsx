import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useUpdateUser } from '@/presentation/hooks/useUpdateUser';
import { Colors } from '@/constants/theme';

// Opción de configuración con switch
const SettingSwitch = ({
  icon,
  label,
  description,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingIconContainer}>
      <Ionicons name={icon} size={22} color={Colors.light.primary} />
    </View>
    <View style={styles.settingTextContainer}>
      <Text style={styles.settingLabel}>{label}</Text>
      {description && <Text style={styles.settingDescription}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.light.icon, true: Colors.light.accent }}
      thumbColor={value ? Colors.light.primary : '#f4f3f4'}
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  rightText?: string;
  danger?: boolean;
}) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.6}>
    <View style={styles.settingIconContainer}>
      <Ionicons name={icon} size={22} color={danger ? '#e74c3c' : Colors.light.primary} />
    </View>
    <View style={styles.settingTextContainer}>
      <Text style={[styles.settingLabel, danger && { color: '#e74c3c' }]}>{label}</Text>
      {description && <Text style={styles.settingDescription}>{description}</Text>}
    </View>
    {rightText && <Text style={styles.settingRightText}>{rightText}</Text>}
    <Ionicons name="chevron-forward" size={18} color={Colors.light.icon} />
  </TouchableOpacity>
);

// Sección del formulario
const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const { update, isUpdating } = useUpdateUser();

  // Estados locales de configuración
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // Estado para edición de username
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');

  const startEditingUsername = () => {
    setUsernameDraft(user?.username || '');
    setEditingUsername(true);
  };

  const cancelEditingUsername = () => {
    setEditingUsername(false);
    setUsernameDraft('');
  };

  const saveUsername = async () => {
    if (!user?.id) return;
    const trimmed = usernameDraft.trim();
    if (!trimmed) {
      Alert.alert('Error', 'El nombre de usuario no puede estar vacío');
      return;
    }

    const updatedUser = await update(user.id, { username: trimmed });
    if (updatedUser) {
      // Actualizar el store de auth con el nuevo username
      useAuthStore.setState({ user: updatedUser });
      setEditingUsername(false);
    } else {
      Alert.alert('Error', 'No se pudo actualizar el nombre de usuario');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es irreversible. ¿Estás seguro de que quieres eliminar tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const memberSince = formatDate(user?.created_at);

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Encabezado */}
        <Text style={styles.headerTitle}>Ajustes</Text>
        <Text style={styles.headerSubtitle}>Configura tu experiencia en la aplicación</Text>

        {/* Tarjeta de perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={64} color={Colors.light.primary} />
          </View>
          <View style={styles.profileInfo}>
            {editingUsername ? (
              <View style={styles.usernameEditContainer}>
                <TextInput
                  style={styles.usernameInput}
                  value={usernameDraft}
                  onChangeText={setUsernameDraft}
                  autoFocus
                  placeholder="Tu nombre de usuario"
                  placeholderTextColor={Colors.light.icon}
                  maxLength={50}
                />
                <View style={styles.usernameEditActions}>
                  <TouchableOpacity onPress={saveUsername} disabled={isUpdating}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={Colors.light.primary} />
                    ) : (
                      <Ionicons name="checkmark-circle" size={28} color={Colors.light.primary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelEditingUsername}>
                    <Ionicons name="close-circle" size={28} color={Colors.light.icon} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={startEditingUsername} style={styles.usernameRow}>
                <Text style={styles.profileName}>{user?.username || 'Usuario'}</Text>
                <Ionicons name="pencil" size={16} color={Colors.light.icon} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            )}
            <Text style={styles.profileEmail}>{user?.email || 'Sin correo'}</Text>
            {memberSince && (
              <Text style={styles.profileDate}>Miembro desde {memberSince}</Text>
            )}
          </View>
        </View>

        {/* Preferencias de la aplicación */}
        <SettingsSection title="Preferencias">
          <SettingSwitch
            icon="moon-outline"
            label="Modo oscuro"
            description="Cambia la apariencia de la aplicación"
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
          />
          <View style={styles.separator} />
          <SettingAction
            icon="language-outline"
            label="Idioma"
            description="Idioma de la aplicación"
            onPress={() => {}}
            rightText="Español"
          />
        </SettingsSection>

        {/* Cuenta */}
        <SettingsSection title="Cuenta">
          <SettingAction
            icon="lock-closed-outline"
            label="Cambiar contraseña"
            description="Actualiza tu contraseña de acceso"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <SettingAction
            icon="trash-outline"
            label="Eliminar cuenta"
            description="Elimina tu cuenta y todos tus datos"
            onPress={handleDeleteAccount}
            danger
          />
        </SettingsSection>

        {/* Información de la aplicación */}
        <SettingsSection title="Información">
          <SettingAction
            icon="information-circle-outline"
            label="Versión"
            description="Versión actual de la aplicación"
            onPress={() => {}}
            rightText="1.0.0"
          />
          <View style={styles.separator} />
          <SettingAction
            icon="document-text-outline"
            label="Términos y condiciones"
            onPress={() => {}}
          />
          <View style={styles.separator} />
          <SettingAction
            icon="shield-checkmark-outline"
            label="Política de privacidad"
            onPress={() => {}}
          />
        </SettingsSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    color: Colors.light.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 24,
  },
  // Tarjeta de perfil
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
    color: Colors.light.primary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  profileDate: {
    fontSize: 12,
    color: Colors.light.icon,
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
    color: Colors.light.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.accent,
    paddingVertical: 2,
  },
  usernameEditActions: {
    flexDirection: 'row',
    gap: 4,
  },
  // Secciones
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.accent,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
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
    backgroundColor: Colors.light.background,
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
    color: Colors.light.text,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 2,
  },
  settingRightText: {
    fontSize: 13,
    color: Colors.light.icon,
    marginRight: 8,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.background,
    marginHorizontal: 16,
  },
});
