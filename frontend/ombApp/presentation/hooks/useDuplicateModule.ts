import { useState } from 'react';
import { duplicateModule } from '@/core/actions/duplicate-module';

export const useDuplicateModule = () => {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = async (
    moduleId: number,
    userId: number,
    options?: { name?: string; technicalName?: string }
  ): Promise<any | null> => {
    setIsDuplicating(true);
    setError(null);

    const result = await duplicateModule(moduleId, userId, options);
    if (!result.success) {
      setError(result.error || 'No se pudo duplicar el módulo.');
      setIsDuplicating(false);
      return null;
    }
    setIsDuplicating(false);
    return result.data;
  };

  return { duplicate, isDuplicating, error };
};
