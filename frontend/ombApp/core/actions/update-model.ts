import { ombApi } from '@/core/auth/api/ombApi';

export async function updateModel(modelId: number, data: any) {
  try {
    const response = await ombApi.put(`/models/${modelId}`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
}
