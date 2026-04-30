import { ombApi } from '@/core/auth/api/ombApi';

export async function updateModule(moduleId: number, data: any) {
  try {
    const response = await ombApi.put(`/modules/${moduleId}`, data);
    return response.data;
  } catch (error: any) {
    console.log('UPDATE MODULE ERROR:', error?.response?.data);
    throw error?.response?.data || error;
  }
}
