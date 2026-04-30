import { useEffect, useState } from 'react';
import { ombApi } from '@/core/auth/api/ombApi';

export interface Field {
  id: number;
  name: string;
  technicalName: string;
  type: string;
  required?: boolean;
  uniqueField?: boolean;
  relationModel?: string | null;
  relationField?: string | null;
}

export function useFieldsOfModel(modelId: number | null) {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = async () => {
    if (!modelId) return;
    setLoading(true);
    setError(null);

    try {
      const { data } = await ombApi.get(`/models/${modelId}/fields`);
      setFields(data);

    } catch (e: any) {
      setError(e?.response?.data || e.message || 'Error al cargar los campos');
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [modelId]);

  return { fields, loading, error, reload: fetchFields };
}
