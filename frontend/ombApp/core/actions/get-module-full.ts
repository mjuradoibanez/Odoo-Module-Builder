import { ombApi } from '@/core/auth/api/ombApi';

export async function getModuleFull(moduleId: number) {
  try {
    const { data } = await ombApi.get(`/modules/${moduleId}/full`);
    return data;
  } catch (error: any) {
    console.log('GET MODULE FULL ERROR:', error?.response?.data);
    return null;
  }
}
