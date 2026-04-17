import { Module } from '@/core/interface/module';
import { ombApi } from '@/core/auth/api/ombApi';

export async function getPublicModules(): Promise<Module[] | null> {
  try {
    const { data } = await ombApi.get('/modules?public=1');
    return data;
  } catch (error: any) {
    console.log('GET PUBLIC MODULES ERROR:', error?.response?.data);
    return null;
  }
}
