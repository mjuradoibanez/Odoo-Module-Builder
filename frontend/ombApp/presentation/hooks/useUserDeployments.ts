import { useState, useEffect, useCallback } from 'react';
import { getUserDeployments, DeploymentRecord } from '@/core/actions/get-user-deployments';

export function useUserDeployments(userId: number) {
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDeployments = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      const data = await getUserDeployments(userId);
      setDeployments(data);
      
    } catch (e) {
      console.log('Error loading deployments:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDeployments();
  }, [loadDeployments]);

  return {
    deployments,
    isLoading,
    refresh: loadDeployments,
  };
}
