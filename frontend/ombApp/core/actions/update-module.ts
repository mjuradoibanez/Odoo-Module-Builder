import { ombApi } from '@/core/auth/api/ombApi';

export async function updateModule(moduleId: number, data: any) {
  try {
    const response = await ombApi.put(`/modules/${moduleId}`, data);
    // Notificar a otras pantallas que los módulos han cambiado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('modules-updated'));
    }
    return response.data;
  } catch (error: any) {
    console.log('UPDATE MODULE ERROR:', error?.response?.data);
    throw error?.response?.data || error;
  }
}
