import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Module } from '@/core/interface/module';
import { getColors, Fonts } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { moduleCategoryIcons } from '@/core/constants/moduleCategoryIcons';


export interface ModuleCardProps {
  module: Module;
  selected?: boolean;
  showLock?: boolean;
  incomplete?: boolean; // Para marcar módulos incompletos (solo en Deploy)
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, selected, showLock, incomplete }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);
  // Evitar problemas de mayúsculas, minúsculas o espacios
  const category = (module.category || 'otra').toLowerCase().replace(/\s+/g, '');
  const iconData = moduleCategoryIcons[category] || moduleCategoryIcons['otra'];
  const showIcon = !!iconData.icon;
  const initial = module.name ? String(module.name).charAt(0).toUpperCase() : '?';

  // Estilos condicionales por si es un módulo incompleto
  const lightestGray = '#F4F4F7';
  const cardStyle = [
    styles.card,
    isDesktop && styles.cardDesktop,
    incomplete && { backgroundColor: lightestGray, borderLeftColor: '#e74c3c' },
    { backgroundColor: colors.card, borderLeftColor: iconData.color },
  ];

  return (
    <View style={cardStyle}>
      {/* Icono o inicial */}
      <View style={[styles.iconContainer, { backgroundColor: iconData.color, shadowColor: colors.border }]}>
        {showIcon ? (
          <Ionicons name={iconData.icon as any} size={28} color={colors.card} />
        ) : (
          <Text style={[styles.iconInitial, { color: colors.card }]}>{initial}</Text>
        )}
      </View>

      {/* Información del módulo */}
      <View style={styles.infoContainer}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.icon} style={{ marginRight: 2 }} />
          <Text style={[styles.date, { color: colors.icon }]}>{new Date(module.createdAt).toLocaleDateString()}</Text>
        </View>

        {/* Nombre y technical name en la misma línea */}
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.primary, fontFamily: Fonts.sans }]} numberOfLines={1}>
            {module.name}
          </Text>
          <Text style={[styles.technicalName, { color: colors.icon, fontFamily: Fonts.sans }]} numberOfLines={1}>
            {module.technicalName}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.description, { color: colors.text, fontFamily: Fonts.sans }]} numberOfLines={2}>
            {module.description || 'Sin descripción'}
          </Text>
        </View>
      </View>

      {/* Candado: abierto si es público, cerrado si es privado */}
      {showLock && (
        <View style={styles.lockContainer}>
          <Ionicons
            name={module.isPublic ? 'lock-open-outline' : 'lock-closed'}
            size={20}
            color={module.isPublic ? colors.accent : colors.icon}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderLeftWidth: 6,
    marginBottom: 8,
  },
  cardDesktop: {
    padding: 18,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconInitial: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  technicalName: {
    fontSize: 13,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  description: {
    fontSize: 13,
    flex: 1,
  },
  lockContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
});
