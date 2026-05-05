import { User } from '@/core/interface/user';
import { ombApi } from '@/core/auth/api/ombApi';

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
}

export const updateUser = async (userId: number, data: UpdateUserDto): Promise<User | null> => {
  try {
    const response = await ombApi.put<User>(`/user/${userId}`, data);
    return response.data;
    
  } catch (error: any) {
    console.log('UPDATE USER ERROR:', error?.response?.data);
    return null;
  }
};
