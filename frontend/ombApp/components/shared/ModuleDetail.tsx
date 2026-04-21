import React from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useModuleFull } from '@/presentation/hooks/useModuleFull';
import { ModuleCard } from '@/components/shared/ModuleCard';

interface ModuleDetailProps {
  moduleId: number;
}

export const ModuleDetail: React.FC<ModuleDetailProps> = ({ moduleId }) => {
  const { module, isLoading } = useModuleFull(moduleId);

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }
  if (!module) {
    return <Text style={{ color: 'red', marginTop: 40 }}>No se encontró el módulo.</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Cabecera visual del módulo */}
      <View>
        <ModuleCard module={module} />
      </View>

      {/* Modelos */}
      <View style={{ marginHorizontal: 35 }}>
        <Text style={styles.sectionTitle}>Modelos</Text>
      </View>
      {module.models && module.models.length > 0 ? (
        module.models.map((model: any) => (
          <View key={model.id} style={{ ...styles.modelBox, marginHorizontal: 30 }}>
            <Text style={styles.modelName}>{model.name} <Text style={styles.modelTech}>({model.technicalName})</Text></Text>
            {/* Campos */}
            <Text style={styles.subSectionTitle}>Campos</Text>
            {model.fields && model.fields.length > 0 ? (
              model.fields.map((field: any) => (
                <View key={field.id} style={styles.fieldRow}>
                  <Text style={styles.fieldName}>{field.name}</Text>
                  <Text style={styles.fieldType}>{field.type}</Text>
                  {field.required && <Text style={styles.fieldRequired}>*</Text>}
                  {field.relationModel && (
                    <Text style={styles.fieldRelation}>→ {field.relationModel}</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Sin campos</Text>
            )}
            {/* Vistas */}
            <Text style={styles.subSectionTitle}>Vistas</Text>
            {model.views && model.views.length > 0 ? (
              model.views.map((view: any) => (
                <View key={view.id} style={styles.viewRow}>
                  <Text style={styles.viewType}>{view.type}</Text>
                  <Text style={styles.viewName}>{view.name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Sin vistas</Text>
            )}
          </View>
        ))
      ) : (
        <View style={{ marginHorizontal: 30 }}>
          <Text style={styles.emptyText}>Este módulo no tiene modelos.</Text>
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
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modelTech: {
    fontSize: 13,
    color: '#888',
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
    color: '#7B61FF',
    marginRight: 8,
  },
  fieldRequired: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginRight: 8,
  },
  fieldRelation: {
    fontSize: 13,
    color: '#2196F3',
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  viewType: {
    fontSize: 13,
    color: '#4CAF50',
    marginRight: 8,
  },
  viewName: {
    fontSize: 13,
    color: '#888',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    marginLeft: 8,
    marginBottom: 4,
  },
});
