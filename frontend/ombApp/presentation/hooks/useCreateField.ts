import { useState } from 'react';
import { createField, CreateFieldInput } from '@/core/actions/create-field';

export function useCreateField() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: CreateFieldInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await createField(input);
      setLoading(false);
      return data;

    } catch (e: any) {
      setError(e.message || 'Error al crear el campo');
      setLoading(false);
      return null;
    }
  };

  return { create, loading, error };
}
