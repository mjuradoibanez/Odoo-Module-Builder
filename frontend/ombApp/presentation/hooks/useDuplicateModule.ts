import { useState } from 'react';
import { duplicateModule } from '@/core/actions/duplicate-module';

export const useDuplicateModule = () => {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = async (moduleId: number, userId: number): Promise<any | null> => {
    setIsDuplicating(true);
    setError(null);

    const result = await duplicateModule(moduleId, userId);
    if (!result) {
      setError('No se pudo duplicar el módulo. Es posible que ya tengas un módulo con el mismo nombre técnico.');
    }
    setIsDuplicating(false);
    return result;
  };

  return { duplicate, isDuplicating, error };
};
