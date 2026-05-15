import { Module } from '@/core/interface/module';
import { ombApi } from '@/core/auth/api/ombApi';

export async function getAllModules(): Promise<Module[] | null> {
  try {
    const { data } = await ombApi.get('/modules');
    return data;
    
  } catch (error: any) {
    console.log('GET ALL MODULES ERROR:', error?.response?.data);
    return null;
  }
}
