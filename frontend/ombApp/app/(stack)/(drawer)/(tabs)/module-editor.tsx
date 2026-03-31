import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';

const ModuleEditorScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return (
    <View style={[{ flex: 1 }, isDesktop && { paddingLeft: 80, backgroundColor: '#F7F7F7' }]}> 
      <Text>moduleEditorScreen</Text>
    </View>
  );
};

export default ModuleEditorScreen;