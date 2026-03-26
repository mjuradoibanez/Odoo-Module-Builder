import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Modal from 'react-native-modal';

// mapa de iconos asociados a rutas
const tabIcons: { name: 'home-outline' | 'search-outline' | 'library-outline' | 'add-circle-outline'; route: string }[] = [
  { name: 'home-outline', route: 'home/index' },
  { name: 'search-outline', route: 'busqueda/index' },
  { name: 'library-outline', route: 'biblioteca/index' },
  { name: 'add-circle-outline', route: 'modal' },
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
            ? { flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', width: 80, height: '100vh', position: 'fixed', left: 0, top: 0, borderRightColor: '#A084A2', borderRightWidth: 1, backgroundColor: '#F7F7F7', zIndex: 100 }
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
            <Ionicons
              name={tab.name}
              size={28}
              color={activeIndex === idx ? '#714B67' : '#A084A2'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
