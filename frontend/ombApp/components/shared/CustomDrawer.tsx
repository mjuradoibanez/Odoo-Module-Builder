import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

const CustomDrawer = (props: DrawerContentComponentProps) => {
    const userId = useAuthStore(state => state.user?.id);
    
        // Opciones principales del menú
        const menuOptions = [
            {
                label: 'Settings',
                icon: 'settings-outline',
                route: '/(stack)/(drawer)/(tabs)/settings' as const,
            },
            {
                label: 'Profile',
                icon: 'person-outline',
                route: '/(stack)/(drawer)/(tabs)/profile' as const,
            },
            {
                label: 'About',
                icon: 'information-circle-outline',
                route: '/(stack)/(drawer)/(tabs)/about' as const,
            },
        ];

        // Ruta activa
        const navState = props.state;
        const activeRoute = navState?.routeNames[navState.index] || '';

        return (
            <DrawerContentScrollView {...props} style={{ backgroundColor: Colors.light.background }} contentContainerStyle={{ padding: 0 }}>
                <View style={{ padding: 24, backgroundColor: Colors.light.primary, borderBottomColor: Colors.light.border, borderBottomWidth: 2, alignItems: 'center' }}>
                    <Text style={{ color: Colors.light.card, fontWeight: 'bold', fontSize: 28, fontFamily: 'Montserrat-Bold', letterSpacing: 2 }}>Odoo Builder</Text>
                </View>
                <View style={{ marginTop: 16 }}>
                    {menuOptions.map(opt => {
                        const focused = activeRoute === opt.route.replace('/', '');
                        return (
                            <DrawerItem
                                key={opt.route}
                                label={opt.label}
                                labelStyle={{ color: focused ? Colors.light.accent : Colors.light.primary, fontFamily: 'Montserrat-Bold', fontSize: 16 }}
                                icon={({ size }) => (
                                    <Ionicons name={opt.icon as any} size={size} color={focused ? Colors.light.accent : Colors.light.primary} />
                                )}
                                style={{ backgroundColor: focused ? Colors.light.primary + '22' : Colors.light.background, borderRadius: 8, marginVertical: 2 }}
                                onPress={() => router.push(opt.route)}
                            />
                        );
                    })}
                </View>
                <View style={{ marginTop: 32 }}>
                    <DrawerItem
                        label="Cerrar sesión"
                        labelStyle={{ color: '#e74c3c', fontFamily: 'Montserrat-Bold', fontSize: 16 }}
                        icon={({ size }) => (
                            <Ionicons name='log-out-outline' size={size} color="#e74c3c" />
                        )}
                        onPress={async () => {
                            await useAuthStore.getState().logout();
                            router.replace('/auth/login');
                        }}
                        style={{ backgroundColor: Colors.light.background, borderRadius: 8 }}
                    />
                </View>
            </DrawerContentScrollView>
        );
};

export default CustomDrawer;