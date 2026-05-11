import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { blurActiveElement } from '@/core/helpers/blurActiveElement';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useUserModules } from '@/presentation/hooks/useUserModules';
import { usePublicModules } from '@/presentation/hooks/usePublicModules';
import { useUserFavorites } from '@/presentation/hooks/useUserFavorites';
import { useAddFavorite } from '@/presentation/hooks/useAddFavorite';
import { useRemoveFavorite } from '@/presentation/hooks/useRemoveFavorite';
import { getColors } from '@/constants/theme';
import { useThemeStore } from '@/presentation/store/useThemeStore';
import { moduleCategoryIcons } from '@/core/constants/moduleCategoryIcons';
import { Module } from '@/core/interface/module';

// Pagina de inicio con scroll horizontal por secciones

// Tarjeta compacta para módulos
const CompactModuleCard = React.memo(function CompactModuleCard({
  module,
  onPress,
  colors,
  isFavorite,
  onToggleFavorite,
  isToggling = false,
}: {
  module: Module;
  onPress: () => void;
  colors: ReturnType<typeof getColors>;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isToggling?: boolean;
}) {
  const category = (module.category || 'otra')
    .toLowerCase()
    .replace(/\s+/g, '');

  const iconData =
    moduleCategoryIcons[category] || moduleCategoryIcons['otra'];

  const initial = module.name
    ? String(module.name).charAt(0).toUpperCase()
    : '?';

  const showFavorite =
    typeof isFavorite === 'boolean' && !!onToggleFavorite;

  return (
    <TouchableOpacity
      style={[
        styles.compactCard,
        { backgroundColor: colors.card },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.compactIconContainer,
          { backgroundColor: iconData.color },
        ]}
      >
        {iconData.icon ? (
          <Ionicons
            name={iconData.icon as any}
            size={32}
            color="#fff"
          />
        ) : (
          <Text style={styles.compactIconInitial}>
            {initial}
          </Text>
        )}

        {showFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onToggleFavorite}
            disabled={isToggling}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? '#ff3b5c' : '#fff'}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text
        style={[
          styles.compactTitle,
          { color: colors.primary },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {module.name}
      </Text>

      <Text
        style={[
          styles.compactSubtitle,
          { color: colors.icon },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {module.technicalName}
      </Text>
    </TouchableOpacity>
  );
});

// Header con titulo y boton opcional
const SectionHeader = ({ title, onSeeAll, colors }: { title: string; onSeeAll?: () => void; colors: ReturnType<typeof getColors> }) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>

    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={[styles.seeAllText, { color: colors.accent }]}>Ver todo</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Componente para scroll horizontal
const HorizontalScrollRow = ({
  data,
  onPressModule,
  emptyMessage,
  colors,
}: {
  data: Module[];
  onPressModule: (id: number) => void;
  emptyMessage: string;
  colors: ReturnType<typeof getColors>;
}) => {
  if (data.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: colors.icon }]}>{emptyMessage}</Text>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      snapToInterval={160}
      decelerationRate="fast"
    >
      {data.map((item) => (
        <CompactModuleCard
          key={item.id}
          module={item}
          onPress={() => onPressModule(item.id)}
          colors={colors}
        />
      ))}
    </ScrollView>
  );
};

// Pantalla principal del dashboard
const DashboardScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const colors = getColors(isDarkMode);

  const { modules: myModules, isLoading: isLoadingMy, reload } = useUserModules(userId ?? 0);
  const { modules: publicModules, isLoading: isLoadingPublic } = usePublicModules();
  const { favorites, favoriteInfos, isLoading: isLoadingFavs, reload: reloadFavs } = useUserFavorites(userId ?? 0);
  const { add } = useAddFavorite();
  const { remove } = useRemoveFavorite();

  // Mapa de moduleId - favoriteId para poder eliminar
  const [favoriteMap, setFavoriteMap] = useState<Map<number, number>>(new Map());
  const [toggleIds, setToggleIds] = useState<Set<number>>(new Set());

  // Sincronizar favoritos desde el hook
  useEffect(() => {
    const map = new Map<number, number>();
    favoriteInfos.forEach((fi) => {
      map.set(fi.module.id, fi.favoriteId);
    });
    setFavoriteMap(map);
  }, [favoriteInfos]);

  // Recarga automática al editar módulos
  useEffect(() => {
    const handler = () => {
      reload();
      reloadFavs();
    };

    window.addEventListener('modules-updated', handler);
    
    // Limpia al desmontar
    return () => window.removeEventListener('modules-updated', handler);
  }, [reload, reloadFavs]);

  const handlePressModule = useCallback((moduleId: number) => {
    blurActiveElement();
    router.push({ pathname: '/modules', params: { id: moduleId } });
  }, []);

  const handleSeeAll = useCallback(() => {
    blurActiveElement();
    router.push({ pathname: '/modules' });
  }, []);

  // Añadir o eliminar de favoritos y recargar la lista
  const handleToggleFavorite = useCallback(async (moduleId: number) => {
    if (!userId) return;

    setToggleIds((prev) => new Set(prev).add(moduleId));

    const favoriteId = favoriteMap.get(moduleId);
    if (favoriteId) {
      await remove(favoriteId);
    } else {
      await add(userId, moduleId);
    }

    await reloadFavs();
    setToggleIds((prev) => {
      const next = new Set(prev);
      next.delete(moduleId);
      return next;
    });
  }, [userId, favoriteMap, add, remove, reloadFavs]);

  if (!userId) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const myPublicModules = myModules.filter((m) => m.isPublic);
  const communityModules = publicModules.filter((m) => m.isPublic && m.user.id !== userId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, isDesktop && styles.containerDesktop]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollVertical}>
        {/* Mensaje bienvenida */}
        <Text style={[styles.greeting, { color: colors.primary }]}>Bienvenido, {user?.username || 'Usuario'}</Text>

        {/* Sección: Tus módulos públicos */}
        <SectionHeader title="Tus módulos públicos" onSeeAll={handleSeeAll} colors={colors} />
        {isLoadingMy ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <HorizontalScrollRow
            data={myPublicModules}
            onPressModule={handlePressModule}
            emptyMessage="No tienes módulos públicos todavía."
            colors={colors}
          />
        )}

        {/* Sección: Tus módulos favoritos */}
        <SectionHeader title="Tus favoritos" colors={colors} />
        {isLoadingFavs ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <HorizontalScrollRow
            data={favorites}
            onPressModule={handlePressModule}
            emptyMessage="Aún no tienes módulos favoritos."
            colors={colors}
          />
        )}

        {/* Sección: Módulos públicos de la comunidad */}
        <SectionHeader title="Módulos públicos de la comunidad" colors={colors} />
        {isLoadingPublic ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : communityModules.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.icon }]}>No hay módulos públicos de otros usuarios disponibles.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            snapToInterval={160}
            decelerationRate="fast"
          >
            {communityModules.map((item) => (
              <CompactModuleCard
                key={item.id}
                module={item}
                onPress={() => handlePressModule(item.id)}
                isFavorite={favoriteMap.has(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
                isToggling={toggleIds.has(item.id)}
                colors={colors}
              />
            ))}
          </ScrollView>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollVertical: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingRight: 24,
    gap: 12,
  },
  compactCard: {
    width: 150,
    borderRadius: 12,
    padding: 12,
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    elevation: 3,
  },
  compactIconContainer: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  compactIconInitial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 11,
  },
  emptyText: {
    fontStyle: 'italic',
    fontSize: 14,
    paddingVertical: 16,
    paddingLeft: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DashboardScreen;
