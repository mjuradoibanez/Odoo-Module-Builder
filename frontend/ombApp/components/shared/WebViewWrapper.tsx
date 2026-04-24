import { View, Platform } from 'react-native';
import React from 'react';

// Componente wrapper para usar WebView en móvil y un div normal en web, evitando problemas de compatibilidad
interface WebViewWrapperProps {
  style?: React.CSSProperties | any;
  children: React.ReactNode;
}

export const WebViewWrapper: React.FC<WebViewWrapperProps> = ({ style, children }) => {
  if (Platform.OS === 'web') {
    // @ts-ignore
    return <div style={style}>{children}</div>;
  }
  return <View style={style}>{children}</View>;
};
