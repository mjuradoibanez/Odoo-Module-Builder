import { ombApi } from '@/core/auth/api/ombApi';

export async function deleteModule(moduleId: number) {
  try {
    await ombApi.delete(`/modules/${moduleId}`);
    return true;
    
  } catch (error: any) {
    console.log('DELETE MODULE ERROR:', error?.response?.data);
    return false;
  }
}
