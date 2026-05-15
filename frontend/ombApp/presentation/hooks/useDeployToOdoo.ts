import { useState, useCallback } from 'react';
import { deployToOdoo, DeployResult } from '@/core/actions/deploy-to-odoo';

export function useDeployToOdoo() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);

  const deploy = useCallback(async (moduleId: number) => {
    setIsDeploying(true);
    setDeployResult(null);

    try {
      const result = await deployToOdoo(moduleId);
      setDeployResult(result);
      return result;
    } catch (error: any) {
      const errorResult: DeployResult = {
        success: false,
        error: error?.message || 'Error inesperado durante el despliegue',
      };
      setDeployResult(errorResult);
      return errorResult;
    } finally {
      setIsDeploying(false);
    }
  }, []);

  const resetResult = useCallback(() => {
    setDeployResult(null);
  }, []);

  return {
    deploy,
    isDeploying,
    deployResult,
    resetResult,
  };
}
