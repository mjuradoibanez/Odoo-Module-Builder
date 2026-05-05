import { ombApi } from '@/core/auth/api/ombApi';

export async function duplicateModule(moduleId: number, userId: number): Promise<any | null> {
  try {
    const { data } = await ombApi.post(`/modules/${moduleId}/duplicate`, { user_id: userId });
    return data;
    
  } catch (error: any) {
    console.log('DUPLICATE MODULE ERROR:', error?.response?.data);
    return null;
  }
}
