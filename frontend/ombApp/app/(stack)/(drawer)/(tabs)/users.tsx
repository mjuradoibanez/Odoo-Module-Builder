import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
    StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { blurActiveElement } from '@/core/helpers/blurActiveElement';
import { getAllUsers } from '@/core/actions/get-all-users';
import { User } from '@/core/interface/user';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';

const UsersScreen = () => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const isDarkMode = useThemeStore((state) => state.isDarkMode);
    const colors = getColors(isDarkMode);
    const currentUser = useAuthStore((state) => state.user);
    const currentUserId = currentUser?.id;

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllUsers();
        if (data) {
            setUsers(data);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleUserPress = (user: User) => {
        blurActiveElement();
        router.push({ pathname: '/modules', params: { userId: user.id } });
    };

    const formatDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const renderUserItem = ({ item }: { item: User }) => {
        const username = item.username || 'Usuario';
        const userInitial = username.charAt(0).toUpperCase();

        return (
            <TouchableOpacity
                style={[styles.userCard, { backgroundColor: colors.card }]}
                onPress={() => handleUserPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{userInitial}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
                        {username}
                    </Text>
                    <Text style={[styles.joinDate, { color: colors.icon }]}>
                        Se unió el {formatDate(item.createdAt)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
        );
    };

    // Separar el usuario actual del resto
    const currentUserData = users.find((u) => u.id === currentUserId) || null;
    const communityUsers = users.filter((u) => u.id !== currentUserId);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }, isDesktop && styles.containerDesktop]}>
            {/* Cabecera */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        blurActiveElement();
                        router.back();
                    }}
                    activeOpacity={0.7}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Usuarios</Text>
            </View>

            {/* Contenido */}
            {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : users.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color={colors.icon} />
                    <Text style={[styles.emptyText, { color: colors.icon }]}>No hay usuarios registrados</Text>
                </View>
            ) : (
                <FlatList
                    ListHeaderComponent={
                        <>
                            {/* Sección: Tu Perfil */}
                            {currentUserData && (
                                <>
                                    <Text style={[styles.sectionLabel, { color: colors.icon }]}>TU PERFIL</Text>
                                    {renderUserItem({ item: currentUserData })}
                                    {communityUsers.length > 0 && (
                                        <Text style={[styles.sectionLabel, { color: colors.icon, marginTop: 20 }]}>
                                            PERFILES DE LA COMUNIDAD
                                        </Text>
                                    )}
                                </>
                            )}
                        </>
                    }
                    data={communityUsers}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 16,
    },
    containerDesktop: {
        paddingLeft: 80,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
        marginHorizontal: 16,
        textTransform: 'uppercase',
    },
    listContent: {
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        marginHorizontal: 16,
        gap: 14,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
    },
    joinDate: {
        fontSize: 13,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 80,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
    },
});

export default UsersScreen;
