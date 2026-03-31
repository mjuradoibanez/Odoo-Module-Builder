import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Module } from '@/core/interface/module';
import { Colors, Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { moduleCategoryIcons } from '@/core/constants/moduleCategoryIcons';

interface ModuleCardProps {
  module: Module;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const categoria = module.categoria || 'otros';
  const iconData = moduleCategoryIcons[categoria] || moduleCategoryIcons['otros'];
  const showIcon = !!iconData.icon;
  const initial = module.name ? module.name.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.card, isDesktop && styles.cardDesktop]}> 
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: iconData.color }]}> 
          {showIcon ? (
            <Ionicons name={iconData.icon as any} size={28} color={Colors.light.card} />
          ) : (
            <Text style={styles.iconInitial}>{initial}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{module.name}</Text>
          <Text style={styles.technicalName}>{module.technicalName}</Text>
        </View>
        <View style={styles.versionDateCol}>
          <Text style={styles.version}>v{module.version}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.light.icon} style={{ marginRight: 2 }} />
            <Text style={styles.date}>{new Date(module.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      {module.description && (
        <Text style={styles.description}>{module.description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 18,
    marginVertical: 12,
    marginHorizontal: 0,
    shadowColor: Colors.light.border,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 6,
    borderLeftColor: Colors.light.primary,
  },
  cardDesktop: {
    marginLeft: 32,
    marginRight: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: Colors.light.border,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  iconInitial: {
    color: Colors.light.card,
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Fonts.sans,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    fontFamily: Fonts.sans,
  },
  technicalName: {
    fontSize: 13,
    color: Colors.light.icon,
    fontFamily: Fonts.sans,
    marginBottom: 2,
  },
  versionDateCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minWidth: 70,
  },
  version: {
    fontSize: 13,
    color: Colors.light.accent,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: Fonts.sans,
    marginBottom: 8,
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.light.icon,
    fontFamily: Fonts.sans,
    marginLeft: 4,
  },
});
