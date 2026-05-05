import { useState } from 'react';
import { updateUser, UpdateUserDto } from '@/core/actions/update-user';
import { User } from '@/core/interface/user';

export const useUpdateUser = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (userId: number, data: UpdateUserDto): Promise<User | null> => {
    setIsUpdating(true);
    setError(null);

    try {
      const updatedUser = await updateUser(userId, data);
      if (!updatedUser) {
        setError('No se pudo actualizar el usuario');
        return null;
      }
      return updatedUser;
    } catch (err: any) {
      const msg = err?.response?.data || 'Error al actualizar el usuario';
      setError(msg);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    update,
    isUpdating,
    error,
  };
};
