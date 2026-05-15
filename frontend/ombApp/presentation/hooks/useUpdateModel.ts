import { useState } from 'react';
import { updateModel } from '@/core/actions/update-model';

export function useUpdateModel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = async (modelId: number, data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await updateModel(modelId, data);
      setSuccess(true);
      return true;
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : (err?.message || 'Error al actualizar el modelo');
      setError(msg);
      return msg;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error, success };
}
