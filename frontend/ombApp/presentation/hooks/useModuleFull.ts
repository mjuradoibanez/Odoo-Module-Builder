import { useEffect, useState } from 'react';
import { getModuleFull } from '@/core/actions/get-module-full';

export const useModuleFull = (moduleId: number) => {
  const [module, setModule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!moduleId) return;
    loadModule();
  }, [moduleId]);

  const loadModule = async () => {
    setIsLoading(true);

    const data = await getModuleFull(moduleId);

    setModule(data);
    setIsLoading(false);
  };

  return { module, isLoading, reload: loadModule };
};
