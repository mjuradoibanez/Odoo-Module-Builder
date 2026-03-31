import { useEffect, useState } from 'react';
import { getUserModules } from '@/core/actions/get-user-modules';
import { Module } from '@/core/interface/module';

export const useUserModules = (userId: number) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, [userId]);

  const loadModules = async () => {
    setIsLoading(true);

    const data = await getUserModules(userId);

    setModules(data || []);
    setIsLoading(false);
  };

  return { modules, isLoading, reload: loadModules };
};
