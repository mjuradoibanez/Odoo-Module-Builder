import { useEffect, useState } from 'react';
import { getModelFields } from '@/core/actions/get-model-fields';

export function useModelFields(modelId?: number) {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!modelId);

  useEffect(() => {
    if (!modelId) {
      setFields([]);
      return;
    }
    
    setLoading(true);
    getModelFields(modelId).then(f => {
      setFields(f || []);
      setLoading(false);
    });
  }, [modelId]);

  return { fields, loading };
}
