import { ombApi } from '@/core/auth/api/ombApi';

export async function createModel(data: any) {
  try {
    const response = await ombApi.post('/models', data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
}
