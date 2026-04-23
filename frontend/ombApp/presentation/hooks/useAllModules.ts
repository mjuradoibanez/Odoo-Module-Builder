import { useEffect, useState } from 'react';
import { getAllModules } from '@/core/actions/get-all-modules';

export function useAllModules() {
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setIsLoading(true);

    const data = await getAllModules();
    
    setModules(data || []);
    setIsLoading(false);
  };

  return { modules, isLoading, reload: loadModules };
}
