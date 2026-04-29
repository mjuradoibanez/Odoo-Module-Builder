import { ombApi } from '@/core/auth/api/ombApi';

export async function getModelFields(modelId: number) {
  try {
    const { data } = await ombApi.get(`/models/${modelId}/fields`);
    return data;
    
  } catch (error: any) {
    console.error('GET MODEL FIELDS ERROR:', error?.response?.data);
    return [];
  }
}
