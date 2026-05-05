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
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { useUserModules } from '@/presentation/hooks/useUserModules';
import { usePublicModules } from '@/presentation/hooks/usePublicModules';
import { useUserFavorites } from '@/presentation/hooks/useUserFavorites';
import { useAddFavorite } from '@/presentation/hooks/useAddFavorite';
import { useRemoveFavorite } from '@/presentation/hooks/useRemoveFavorite';
import { Colors } from '@/constants/theme';
import { moduleCategoryIcons } from '@/core/constants/moduleCategoryIcons';
import { Module } from '@/core/interface/module';

// Pagina de inicio con scroll horizontal por secciones

// Tarjeta compacta para modulos en scroll horizontal
const CompactModuleCard = React.memo(({ module, onPress }: { module: Module; onPress: () => void }) => {
  const category = (module.category || 'otra').toLowerCase().replace(/\s+/g, '');
  const iconData = moduleCategoryIcons[category] || moduleCategoryIcons['otra'];
  const initial = module.name ? String(module.name).charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.compactIconContainer, { backgroundColor: iconData.color }]}>
        {iconData.icon ? (
          <Ionicons name={iconData.icon as any} size={32} color="#fff" />
        ) : (
          <Text style={styles.compactIconInitial}>{initial}</Text>
        )}
      </View>
      
      <Text style={styles.compactTitle} numberOfLines={1} ellipsizeMode="tail">
        {module.name}
      </Text>
      
      <Text style={styles.compactSubtitle} numberOfLines={1} ellipsizeMode="tail">
        {module.technicalName}
      </Text>
    </TouchableOpacity>
  );
});

// Tarjeta compacta para modulos de comunidad con boton de favorito
const CommunityCompactCard = React.memo(({
  module,
  onPress,
  isFavorite,
  onToggleFavorite,
  isToggling,
}: {
  module: Module;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isToggling: boolean;
}) => {
  const category = (module.category || 'otra').toLowerCase().replace(/\s+/g, '');
  const iconData = moduleCategoryIcons[category] || moduleCategoryIcons['otra'];
  const initial = module.name ? String(module.name).charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.compactIconContainer, { backgroundColor: iconData.color }]}>
        {iconData.icon ? (
          <Ionicons name={iconData.icon as any} size={32} color="#fff" />
        ) : (
          <Text style={styles.compactIconInitial}>{initial}</Text>
        )}
        {/* Boton de favorito */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onToggleFavorite}
          disabled={isToggling}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? '#ff3b5c' : '#fff'}
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.compactTitle} numberOfLines={1} ellipsizeMode="tail">
        {module.name}
      </Text>
      
      <Text style={styles.compactSubtitle} numberOfLines={1} ellipsizeMode="tail">
        {module.technicalName}
      </Text>
    </TouchableOpacity>
  );
});

// Header con titulo y boton opcional
const SectionHeader = ({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAllText}>Ver todo</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Componente para scroll horizontal
const HorizontalScrollRow = ({
  data,
  onPressModule,
  emptyMessage,
}: {
  data: Module[];
  onPressModule: (id: number) => void;
  emptyMessage: string;
}) => {
  if (data.length === 0) {
    return (
      <Text style={styles.emptyText}>{emptyMessage}</Text>
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

  const { modules: myModules, isLoading: isLoadingMy, reload } = useUserModules(userId ?? 0);
  const { modules: publicModules, isLoading: isLoadingPublic } = usePublicModules();
  const { favorites, favoriteInfos, isLoading: isLoadingFavs, reload: reloadFavs } = useUserFavorites(userId ?? 0);
  const { add } = useAddFavorite();
  const { remove } = useRemoveFavorite();

  // Mapa de moduleId - favoriteId para poder eliminar
  const [favoriteMap, setFavoriteMap] = useState<Map<number, number>>(new Map());
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

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
    return () => window.removeEventListener('modules-updated', handler);
  }, [reload, reloadFavs]);

  const handlePressModule = useCallback((moduleId: number) => {
    router.push({ pathname: '/modules', params: { id: moduleId } });
  }, []);

  const handleSeeAllPublic = useCallback(() => {
    router.push({ pathname: '/modules' });
  }, []);

  const handleToggleFavorite = useCallback(async (moduleId: number) => {
    if (!userId) return;

    setTogglingIds((prev) => new Set(prev).add(moduleId));

    const favoriteId = favoriteMap.get(moduleId);
    if (favoriteId) {
      await remove(favoriteId);
    } else {
      await add(userId, moduleId);
    }

    await reloadFavs();
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.delete(moduleId);
      return next;
    });
  }, [userId, favoriteMap, add, remove, reloadFavs]);

  if (!userId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const myPublicModules = myModules.filter((m) => m.isPublic);
  const communityModules = publicModules.filter((m) => m.isPublic && m.user.id !== userId);

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollVertical}>
        {/* Mensaje bienvenida */}
        <Text style={styles.greeting}>Bienvenido, {user?.username || 'Usuario'}</Text>

        {/* Sección: Tus módulos públicos */}
        <SectionHeader title="Tus módulos públicos" onSeeAll={handleSeeAllPublic} />
        {isLoadingMy ? (
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: 20 }} />
        ) : (
          <HorizontalScrollRow
            data={myPublicModules}
            onPressModule={handlePressModule}
            emptyMessage="No tienes módulos públicos todavía."
          />
        )}

        {/* Sección: Tus módulos favoritos */}
        <SectionHeader title="Tus favoritos" />
        {isLoadingFavs ? (
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: 20 }} />
        ) : (
          <HorizontalScrollRow
            data={favorites}
            onPressModule={handlePressModule}
            emptyMessage="Aún no tienes módulos favoritos."
          />
        )}

        {/* Sección: Módulos públicos de la comunidad */}
        <SectionHeader title="Módulos públicos de la comunidad"/>
        {isLoadingPublic ? (
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: 20 }} />
        ) : communityModules.length === 0 ? (
          <Text style={styles.emptyText}>No hay módulos públicos de otros usuarios disponibles.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            snapToInterval={160}
            decelerationRate="fast"
          >
            {communityModules.map((item) => (
              <CommunityCompactCard
                key={item.id}
                module={item}
                onPress={() => handlePressModule(item.id)}
                isFavorite={favoriteMap.has(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
                isToggling={togglingIds.has(item.id)}
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
    backgroundColor: Colors.light.background,
    paddingTop: 16,
  },
  containerDesktop: {
    paddingLeft: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  scrollVertical: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
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
    color: Colors.light.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.accent,
  },
  scrollContent: {
    paddingRight: 24,
    gap: 12,
  },
  compactCard: {
    width: 150,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
    color: Colors.light.primary,
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 11,
    color: Colors.light.icon,
  },
  emptyText: {
    color: Colors.light.icon,
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
