import { ombApi } from '@/core/auth/api/ombApi';

// Generar el módulo Odoo y devolver el blob
export async function generateAndDownloadModule(moduleJson: any) {
  try {
    const response = await ombApi.post('/api/generate-module', moduleJson, {
      responseType: 'blob',
    });
    return response.data; // Devuelve el blob
  } catch (error: any) {
    console.log('GENERATE MODULE ERROR:', error?.response?.data);
    return null;
  }
}
