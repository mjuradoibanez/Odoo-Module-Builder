import { useEffect, useState } from 'react';
import { getUserModels } from '@/core/actions/get-user-models';
import { Model } from '@/core/interface/model';

export const useUserModels = (userId: number) => {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, [userId]);

  const loadModels = async () => {
    setIsLoading(true);
    
    const data = await getUserModels(userId);

    setModels(data || []);
    setIsLoading(false);
  };

  return { models, isLoading, reload: loadModels };
};
