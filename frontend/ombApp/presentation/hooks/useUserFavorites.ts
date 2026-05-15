import { useEffect, useState } from 'react';
import { getUserFavorites, FavoriteRecord } from '@/core/actions/get-user-favorites';
import { Module } from '@/core/interface/module';

// Convertir para compatibilidad con otros componentes
function toModule(fav: FavoriteRecord): Module {
  return {
    id: fav.moduleId,
    name: fav.name,
    technicalName: fav.technicalName,
    description: fav.description,
    version: fav.version,
    author: fav.author,
    category: fav.category,
    isPublic: fav.isPublic,
    createdAt: fav.createdAt,
    user: fav.user as any,
  };
}

export interface FavoriteInfo {
  favoriteId: number;
  module: Module;
}

export const useUserFavorites = (userId: number) => {
  const [favoriteInfos, setFavoriteInfos] = useState<FavoriteInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    setIsLoading(true);
    const data = await getUserFavorites(userId);
    if (data) {
      setFavoriteInfos(
        data.map((fav) => ({
          favoriteId: fav.id,
          module: toModule(fav),
        }))
      );
    } else {
      setFavoriteInfos([]);
    }
    setIsLoading(false);
  };

  // HorizontalScrollRow espera Module[]
  const modules: Module[] = favoriteInfos.map((fi) => fi.module);

  return { favorites: modules, favoriteInfos, isLoading, reload: loadFavorites };
};
