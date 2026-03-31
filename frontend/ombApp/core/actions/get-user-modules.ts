import { Module } from '@/core/interface/module';
import { ombApi } from '@/core/auth/api/ombApi';

export async function getUserModules(userId: number): Promise<Module[] | null> {
  try {
    const { data } = await ombApi.get(`/user/${userId}/modules`);
    return data;
  } catch (error: any) {
    console.log('GET USER MODULES ERROR:', error?.response?.data);
    return null;
  }
}
