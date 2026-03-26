import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

const CustomDrawer = (props: DrawerContentComponentProps) => {
    const userId = useAuthStore(state => state.user?.id);
    
    return (
        <DrawerContentScrollView {...props} style={{ backgroundColor: Colors.light.background }} contentContainerStyle={{ padding: 0 }}>
            <View style={{ padding: 24, backgroundColor: Colors.light.primary, borderBottomColor: Colors.light.border, borderBottomWidth: 2, alignItems: 'center' }}>
                {/* Puedes poner aquí el logo de Odoo si lo tienes en assets/images/odoo-logo.png */}
                {/* <Image source={require('@/assets/images/odoo-logo.png')} style={{ width: 80, height: 32, resizeMode: 'contain', marginBottom: 8 }} /> */}
                <Text style={{ color: Colors.light.card, fontWeight: 'bold', fontSize: 28, fontFamily: 'Montserrat-Bold', letterSpacing: 2 }}>Odoo Builder</Text>
            </View>

            {/*
            <DrawerItem
                label="Perfil"
                labelStyle={{ color: Colors.light.primary, fontFamily: 'Montserrat-Bold', fontSize: 16 }}
                icon={({ size }) => (
                    <Ionicons name='person-outline' size={size} color={Colors.light.primary} />
                )}
                onPress={() => router.push('/perfil')}
                style={{ backgroundColor: Colors.light.background }}
            />

            <DrawerItem
                label="Configuración"
                labelStyle={{ color: Colors.light.primary, fontFamily: 'Montserrat-Bold', fontSize: 16 }}
                icon={({ size }) => (
                    <Ionicons name='settings-outline' size={size} color={Colors.light.primary} />
                )}
                onPress={() => router.push('/configuracion')}
                style={{ backgroundColor: Colors.light.background }}
            />
            
            {plan === 'premium' && (
                <DrawerItem
                    label="Suscripciones"
                    labelStyle={{ color: Colors.light.primary, fontFamily: 'Montserrat-Bold', fontSize: 16 }}
                    icon={({ size }) => (
                        <Ionicons name='card-outline' size={size} color={Colors.light.primary} />
                    )}
                    onPress={() => router.push('/suscripciones')}
                    style={{ backgroundColor: Colors.light.background }}
                />
            )}
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
                style={{ backgroundColor: Colors.light.background }}
            />
             */}
        </DrawerContentScrollView>
    );
};

export default CustomDrawer;