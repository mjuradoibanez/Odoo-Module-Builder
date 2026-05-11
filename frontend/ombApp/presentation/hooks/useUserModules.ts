import { useEffect, useState, useCallback } from 'react';
import { getUserModules } from '@/core/actions/get-user-modules';
import { Module } from '@/core/interface/module';

export const useUserModules = (userId: number) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadModules = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    const data = await getUserModules(userId);

    setModules(data || []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // Escuchar el evento modules-updated para refrescar cuando se crea/elimina un módulo
  useEffect(() => {
    const handler = () => loadModules();
    if (typeof window !== 'undefined') {
      window.addEventListener('modules-updated', handler);
      return () => window.removeEventListener('modules-updated', handler);
    }
  }, [loadModules]);

  return { modules, isLoading, reload: loadModules };
};
