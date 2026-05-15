import React from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useModuleFull } from '@/presentation/hooks/useModuleFull';
import { ModuleCard } from '@/components/shared/ModuleCard';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';

interface ModuleDetailProps {
  moduleId: number;
}

// Pantalla de detalle completo del módulo, mostrando modelos, campos y vistas
export const ModuleDetail: React.FC<ModuleDetailProps> = ({ moduleId }) => {
  const { module, isLoading } = useModuleFull(moduleId);
  const isDarkMode = useThemeStore(state => state.isDarkMode);
  const colors = getColors(isDarkMode);

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;
  }
  if (!module) {
    return <Text style={{ color: '#e74c3c', marginTop: 40 }}>No se encontró el módulo.</Text>;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabecera visual del módulo */}
      <View>
        <ModuleCard module={module} />
      </View>

      {/* Modelos */}
      <View style={{ marginHorizontal: 35 }}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Modelos</Text>
      </View>
      {module.models && module.models.length > 0 ? (
        module.models.map((model: any) => (
          <View key={model.id} style={[styles.modelBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modelName, { color: colors.text }]}>{model.name} <Text style={[styles.modelTech, { color: colors.icon }]}>({model.technicalName})</Text></Text>
            {/* Campos */}
            <Text style={[styles.subSectionTitle, { color: colors.primary }]}>Campos</Text>
            {model.fields && model.fields.length > 0 ? (
              model.fields.map((field: any) => (
                <View key={field.id} style={styles.fieldRow}>
                  <Text style={[styles.fieldName, { color: colors.text }]}>{field.name}</Text>
                  <Text style={[styles.fieldType, { color: colors.primary }]}>{field.type}</Text>
                  {field.required && <Text style={styles.fieldRequired}>*</Text>}
                  {field.relationModel && (
                    <Text style={[styles.fieldRelation, { color: '#2196F3' }]}>→ {field.relationModel}</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.icon }]}>Sin campos</Text>
            )}
            {/* Vistas */}
            <Text style={[styles.subSectionTitle, { color: colors.primary }]}>Vistas</Text>
            {model.views && model.views.length > 0 ? (
              model.views.map((view: any) => (
                <View key={view.id} style={styles.viewRow}>
                  <Text style={[styles.viewType, { color: '#4CAF50' }]}>{view.type}</Text>
                  <Text style={[styles.viewName, { color: colors.icon }]}>{view.name}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.icon }]}>Sin vistas</Text>
            )}
          </View>
        ))
      ) : (
        <View style={{ marginHorizontal: 30 }}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>Este módulo no tiene modelos.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  modelBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    boxShadow: '0 0 2px rgba(0,0,0,0.04)',
    elevation: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modelTech: {
    fontSize: 13,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: 8,
  },
  fieldName: {
    fontSize: 14,
    marginRight: 8,
  },
  fieldType: {
    fontSize: 13,
    marginRight: 8,
  },
  fieldRequired: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginRight: 8,
  },
  fieldRelation: {
    fontSize: 13,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  viewType: {
    fontSize: 13,
    marginRight: 8,
  },
  viewName: {
    fontSize: 13,
  },
  emptyText: {
    fontStyle: 'italic',
    marginLeft: 8,
    marginBottom: 4,
  },
});
