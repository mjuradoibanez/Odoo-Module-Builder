import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Modal from 'react-native-modal';

// Iconos y rutas para las tabs principales estilo Odoo
const tabIcons: { name: string; route: string }[] = [
  { name: 'apps-outline', route: 'dashboard' },
  { name: 'build-outline', route: 'module-editor' },
  { name: 'layers-outline', route: 'model-editor' },
  { name: 'cloud-upload-outline', route: 'deploy' },
];

export const CustomTabBar = (props: any) => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const userId = useAuthStore(state => state.user?.id);

  // al pulsar en las tabs abre el modal o te lleva a la ruta
  const handleTabPress = (route: string, idx: number) => {
    if (route === 'modal') {
      setModalVisible(true);
      setTitulo('');
      setFeedback(null);

    } else {
      props.navigation.navigate(route);
    }
  };

  // Determinar tab activo
  const activeIndex = props.state?.index ?? 0;

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return (
    <View style={{ backgroundColor: '#F7F7F7' }}>
      <View
        style={
          isDesktop
            ? { flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', width: 80, height: '100%', position: 'absolute', left: 0, top: 0, borderRightColor: '#A084A2', borderRightWidth: 1, backgroundColor: '#F7F7F7', zIndex: 100 }
            : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 56, backgroundColor: '#F7F7F7', borderTopColor: '#A084A2', borderTopWidth: 1 }
        }
      >
        {/* Mapeo de iconos de las tabs */}
        {tabIcons.map((tab, idx) => (
          <TouchableOpacity
            key={tab.name}
            style={isDesktop ? { marginVertical: 24, alignItems: 'center' } : { flex: 1, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => handleTabPress(tab.route, idx)}
          >
            <View style={
              activeIndex === idx
                ? {
                    backgroundColor: '#714B6722', // Aura morada translúcida
                    borderRadius: 32,
                    padding: 10,
                    margin: 2,
                  }
                : {}
            }>
              <Ionicons
                name={tab.name as any}
                size={32}
                color={activeIndex === idx ? '#714B67' : '#A084A2'}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
