import { useEffect, useState } from 'react';
import { getModuleFull } from '@/core/actions/get-module-full';

export const useModuleFull = (moduleId: number) => {
  const [module, setModule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!moduleId) return;
    loadModule();
    // Escuchar evento global para recargar si hay cambios
    const handler = () => loadModule();
    window.addEventListener('modules-updated', handler);
    return () => window.removeEventListener('modules-updated', handler);
  }, [moduleId]);

  const loadModule = async () => {
    setIsLoading(true);

    const data = await getModuleFull(moduleId);

    setModule(data);
    setIsLoading(false);
  };

  return { module, isLoading, reload: loadModule };
};
