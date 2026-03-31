import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';

const DeployScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return (
    <View style={[{ flex: 1 }, isDesktop && { paddingLeft: 80, backgroundColor: '#F7F7F7' }]}> 
      <Text>deployScreen</Text>
    </View>
  );
};

export default DeployScreen;