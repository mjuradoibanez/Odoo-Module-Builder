import { ombApi } from '@/core/auth/api/ombApi';

export async function duplicateModule(
  moduleId: number,
  userId: number,
  options?: { name?: string; technicalName?: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const body: any = { user_id: userId };
    if (options?.name) body.name = options.name;
    if (options?.technicalName) body.technicalName = options.technicalName;

    const { data } = await ombApi.post(`/modules/${moduleId}/duplicate`, body);
    // Notificar a otras pantallas que los módulos han cambiado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('modules-updated'));
    }
    return { success: true, data };
    
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.response?.data?.message || 'No se pudo duplicar el módulo.';
    console.log('DUPLICATE MODULE ERROR:', message);
    return { success: false, error: message };
  }
}
