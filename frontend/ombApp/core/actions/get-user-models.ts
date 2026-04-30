import { ombApi } from '@/core/auth/api/ombApi';
import { Model } from '../interface/model';

export async function getUserModels(userId: number): Promise<Model[] | null> {
  try {
    const { data } = await ombApi.get(`/user/${userId}/models`);
    return data;
    
  } catch (error: any) {
    console.log('GET USER MODELS ERROR:', error?.response?.data);
    return null;
  }
}
