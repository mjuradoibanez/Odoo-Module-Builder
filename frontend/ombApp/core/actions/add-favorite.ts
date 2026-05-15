import { ombApi } from '@/core/auth/api/ombApi';

export async function addFavorite(userId: number, moduleId: number): Promise<any | null> {
  try {
    const { data } = await ombApi.post(`/user/${userId}/favorites`, { module_id: moduleId });
    return data;
    
  } catch (error: any) {
    console.log('ADD FAVORITE ERROR:', error?.response?.data);
    return null;
  }
}
