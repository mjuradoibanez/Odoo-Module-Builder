import { User } from '@/core/interface/user';
import { ombApi } from '@/core/auth/api/ombApi';

export async function getAllUsers(): Promise<User[] | null> {
  try {
    const { data } = await ombApi.get('/users');
    return data;
    
  } catch (error: any) {
    console.log('GET ALL USERS ERROR:', error?.response?.data);
    return null;
  }
}
