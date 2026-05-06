import { useState } from 'react';
import { updateUser, UpdateUserDto } from '@/core/actions/update-user';
import { User } from '@/core/interface/user';

// Traduccioens de mensajes de la API
const ERROR_TRANSLATIONS: Record<string, string> = {
  'Current password is incorrect': 'La contraseña actual no es correcta',
  'Current password is required': 'La contraseña actual es obligatoria',
  'Email already exists': 'El correo electrónico ya está registrado',
  'User not found': 'Usuario no encontrado',
  'Invalid JSON': 'JSON inválido',
};

const translateError = (errorMsg: string): string => {
  return ERROR_TRANSLATIONS[errorMsg] || errorMsg;
};

export const useUpdateUser = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (userId: number, data: UpdateUserDto): Promise<User | null> => {
    setIsUpdating(true);
    setError(null);

    try {
      const updatedUser = await updateUser(userId, data);
      return updatedUser;
    } catch (err: any) {
      const msg = err?.response?.data || 'Error al actualizar el usuario';
      setError(translateError(msg));
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
