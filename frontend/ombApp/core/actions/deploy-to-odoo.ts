import { ombApi } from '@/core/auth/api/ombApi';

export interface DeployResult {
  success: boolean;
  message?: string;
  error?: string;
  log?: string;
  restored?: boolean;
}

// Desplegar un módulo directamente en Odoo (copiar a addons, instalar, verificar log)
export async function deployToOdoo(moduleId: number): Promise<DeployResult | null> {
  try {
    const response = await ombApi.post(`/api/deploy-to-odoo/${moduleId}`);
    return response.data as DeployResult;
  } catch (error: any) {
    console.log('DEPLOY TO ODOO ERROR:', error?.response?.data);
    
    // Si el error viene con datos del servidor
    if (error?.response?.data) {
      return error.response.data as DeployResult;
    }
    
    return {
      success: false,
      error: error?.message || 'Error de conexión con el servidor',
    };
  }
}
