import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { ModuleDetail } from '@/components/shared/ModuleDetail';
import { useLocalSearchParams } from 'expo-router';

const ModuleEditorScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const params = useLocalSearchParams();
  const moduleId = params.id ? Number(params.id) : undefined;
  return (
    <View style={[{ flex: 1 }, isDesktop && { paddingLeft: 80, backgroundColor: '#F7F7F7' }]}> 
      {moduleId ? <ModuleDetail moduleId={moduleId} /> : null}
    </View>
  );
};

export default ModuleEditorScreen;