import { ombApi } from '@/core/auth/api/ombApi';

export interface FavoriteRecord {
  id: number;
  moduleId: number;
  name: string;
  technicalName: string;
  description?: string | null;
  version: string;
  author?: string | null;
  category?: string;
  isPublic?: boolean;
  createdAt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  favoritedAt: string;
}

export async function getUserFavorites(userId: number): Promise<FavoriteRecord[] | null> {
  try {
    const { data } = await ombApi.get(`/user/${userId}/favorites`);
    return data;
  } catch (error: any) {
    console.log('GET USER FAVORITES ERROR:', error?.response?.data);
    return null;
  }
}
