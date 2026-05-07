import { getColors } from '@/constants/theme';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

const CustomDrawer = (props: DrawerContentComponentProps) => {
    const userId = useAuthStore(state => state.user?.id);
    const isDarkMode = useThemeStore(state => state.isDarkMode);
    const colors = getColors(isDarkMode);
    
        // Opciones principales del menú
        const menuOptions = [
            {
                label: 'Settings',
                icon: 'settings-outline',
                route: '/(stack)/(drawer)/(tabs)/settings' as const,
            },
        ];

        // Ruta activa
        const navState = props.state;
        const activeRoute = navState?.routeNames[navState.index] || '';

        return (
            <DrawerContentScrollView {...props} style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 0 }}>
                <View style={{ padding: 24, backgroundColor: colors.primary, borderBottomColor: colors.border, borderBottomWidth: 2, alignItems: 'center' }}>
                    <Text style={{ color: colors.card, fontWeight: 'bold', fontSize: 28, fontFamily: 'Montserrat-Bold', letterSpacing: 2 }}>Odoo Builder</Text>
                </View>
                <View style={{ marginTop: 16 }}>
                    {menuOptions.map(opt => {
                        const focused = activeRoute === opt.route.replace('/', '');
                        return (
                            <DrawerItem
                                key={opt.route}
                                label={opt.label}
                                labelStyle={{ color: focused ? colors.accent : colors.primary, fontFamily: 'Montserrat-Bold', fontSize: 16 }}
                                icon={({ size }) => (
                                    <Ionicons name={opt.icon as any} size={size} color={focused ? colors.accent : colors.primary} />
                                )}
                                style={{ backgroundColor: focused ? colors.primary + '22' : colors.background, borderRadius: 8, marginVertical: 2 }}
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
                        style={{ backgroundColor: colors.background, borderRadius: 8 }}
                    />
                </View>
            </DrawerContentScrollView>
        );
};

export default CustomDrawer;
