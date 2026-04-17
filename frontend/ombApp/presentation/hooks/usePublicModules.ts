import { useEffect, useState } from 'react';
import { getPublicModules } from '@/core/actions/get-public-modules';
import { Module } from '@/core/interface/module';

export const usePublicModules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setIsLoading(true);
    const data = await getPublicModules();
    setModules(data || []);
    setIsLoading(false);
  };

  return { modules, isLoading, reload: loadModules };
};
