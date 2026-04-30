import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { WebViewWrapper } from './WebViewWrapper';

// Iconos y rutas para las tabs principales
const tabIcons: { name: string; route: string }[] = [
  { name: 'apps-outline', route: 'dashboard' },
  { name: 'build-outline', route: 'modules' },
  { name: 'layers-outline', route: 'module-editor' },
  { name: 'cloud-upload-outline', route: 'deploy' },
];

export const CustomTabBar = (props: any) => {
  const router = useRouter();
  const userId = useAuthStore(state => state.user?.id);

  // Al pulsar en las tabs navega a la ruta
  const handleTabPress = (route: string, idx: number) => {
    props.navigation.navigate(route);
  };

  // Determinar tab activo
  const activeIndex = props.state?.index ?? 0;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  return (
    <WebViewWrapper
      style={
        isDesktop
          ? (typeof window !== 'undefined' && window.document
              ? {
                  backgroundColor: '#F7F7F7',
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  width: 80,
                  height: '100vh',
                  borderRight: '1px solid #A084A2',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                }
              : {
                  backgroundColor: '#F7F7F7',
                  width: 80,
                  borderRightColor: '#A084A2',
                  borderRightWidth: 1,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                }
            )
          : { backgroundColor: '#F7F7F7' }
      }
    >
      <View
        style={
          isDesktop
            ? {
                flexDirection: 'column',
                justifyContent: 'center', // centrado vertical
                alignItems: 'flex-start',
                width: '100%',
                height: '100%',
              }
            : {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: 56,
                backgroundColor: '#F7F7F7',
                borderTopColor: '#A084A2',
                borderTopWidth: 1,
              }
        }
      >
        {/* Mapeo de iconos de las tabs */}
        {tabIcons.map((tab, idx) => (
          <TouchableOpacity
            key={tab.name}
            style={
              isDesktop
                ? {
                    marginTop: idx === 0 ? 32 : 0,
                    marginBottom: 24,
                    alignItems: 'flex-start',
                    width: '100%',
                  }
                : { flex: 1, alignItems: 'center', justifyContent: 'center' }
            }
            onPress={() => handleTabPress(tab.route, idx)}
          >
            <View
              style={
                activeIndex === idx
                  ? {
                      backgroundColor: '#714B6722',
                      borderRadius: 32,
                      padding: 10,
                      margin: 2,
                      marginLeft: isDesktop ? 8 : 0,
                    }
                  : { marginLeft: isDesktop ? 8 : 0 }
              }
            >
              <Ionicons
                name={tab.name as any}
                size={32}
                color={activeIndex === idx ? '#714B67' : '#A084A2'}
                style={isDesktop ? { alignSelf: 'flex-start' } : {}}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </WebViewWrapper>
  );
};
