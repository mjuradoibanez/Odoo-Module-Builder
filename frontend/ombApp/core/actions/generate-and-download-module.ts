import { ombApi } from '@/core/auth/api/ombApi';

// Generar el módulo Odoo y devolver el blob
export async function generateAndDownloadModule(moduleJson: any) {
  try {
    const response = await ombApi.post('/api/generate-module', moduleJson, {
      responseType: 'blob', // Blob es un objeto en datos binarios
    });
    return response;
  } catch (error: any) {
    console.log('GENERATE MODULE ERROR:', error?.response?.data);
    return null;
  }
}
