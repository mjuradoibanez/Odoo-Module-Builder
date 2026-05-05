import { ombApi } from '@/core/auth/api/ombApi';

export async function removeFavorite(favoriteId: number): Promise<boolean> {
  try {
    await ombApi.delete(`/favorites/${favoriteId}`);
    return true;
    
  } catch (error: any) {
    console.log('REMOVE FAVORITE ERROR:', error?.response?.data);
    return false;
  }
}
