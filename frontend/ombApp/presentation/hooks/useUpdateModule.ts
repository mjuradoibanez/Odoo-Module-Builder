import { useState } from 'react';
import { updateModule } from '@/core/actions/update-module';

export function useUpdateModule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = async (moduleId: number, data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await updateModule(moduleId, data);
      setSuccess(true);
      return true;
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : (err?.message || 'Error al actualizar el módulo');
      setError(msg);
      return msg;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error, success };
}
