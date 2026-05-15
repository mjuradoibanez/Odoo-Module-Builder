import { useState } from 'react';
import { createModel } from '@/core/actions/create-model';

export function useCreateModel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const create = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await createModel(data);
      setSuccess(true);
      return true;
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : (err?.message || 'Error al crear el modelo');
      setError(msg);
      return msg;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error, success };
}
