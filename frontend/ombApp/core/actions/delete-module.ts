import { ombApi } from '@/core/auth/api/ombApi';

export async function deleteModule(moduleId: number) {
  try {
    await ombApi.delete(`/modules/${moduleId}`);
    // Notificar a otras pantallas que los módulos han cambiado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('modules-updated'));
    }
    return true;
    
  } catch (error: any) {
    console.log('DELETE MODULE ERROR:', error?.response?.data);
    return false;
  }
}
