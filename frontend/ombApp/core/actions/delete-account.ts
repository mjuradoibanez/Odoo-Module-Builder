import { ombApi } from '@/core/auth/api/ombApi';

export const deleteAccount = async (userId: number): Promise<void> => {
  const response = await ombApi.delete(`/users/${userId}`);
  
  if (response.status !== 204 && response.status !== 200) {
    throw new Error('No se pudo eliminar la cuenta');
  }
};
