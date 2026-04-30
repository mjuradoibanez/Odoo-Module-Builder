import { useState } from 'react';
import { createModule } from '@/core/actions/create-module';

export function useCreateModule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const create = async ({ name, technicalName, description, isPublic, user_id, author, category }: {
    name: string;
    technicalName: string;
    description?: string;
    isPublic: boolean;
    user_id: number;
    author?: string;
    category?: string;
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await createModule({ name, technicalName, description, isPublic, user_id, author, category });
    setLoading(false);

    if (result.error) {
      if (typeof result.error === 'string') {
        if (result.error.includes('already exists')) {
          setError('Ya existe un módulo con ese nombre técnico.');
        } else if (result.error.includes('Missing required fields')) {
          setError('Faltan campos obligatorios.');
        } else {
          setError(result.error);
        }
      } else {
        setError('Error desconocido al crear el módulo.');
      }
      return { error: result.error };
    }
    setSuccess(true);
    return { data: result.data };
  };

  return { create, loading, error, success };
}
