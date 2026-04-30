import { useState } from 'react';
import { updateField, UpdateFieldInput } from '@/core/actions/update-field';

export function useUpdateField() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: number, input: UpdateFieldInput) => {
    setLoading(true);
    setError(null);

    try {
      const data = await updateField(id, input);
      setLoading(false);
      return data;
      
    } catch (e: any) {
      setError(e.message || 'Error al actualizar el campo');
      setLoading(false);
      return null;
    }
  };

  return { update, loading, error };
}
