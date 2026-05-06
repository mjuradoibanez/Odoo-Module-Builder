import { User } from '@/core/interface/user';
import { ombApi } from '@/core/auth/api/ombApi';

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

export const updateUser = async (userId: number, data: UpdateUserDto): Promise<User> => {
  const response = await ombApi.put<User>(`/users/${userId}`, data);
  return response.data;
};
