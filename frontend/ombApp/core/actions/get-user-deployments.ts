import { ombApi } from '@/core/auth/api/ombApi';

export interface DeploymentRecord {
  id: number;
  status: string;
  log: string;
  created_at: string;
  createdAt: string;
  module: {
    id: number;
    name: string;
    technical_name: string;
    technicalName: string;
  };
}

// Obtener el historial de deployments de los módulos de un usuario
export async function getUserDeployments(userId: number): Promise<DeploymentRecord[]> {
  try {
    const response = await ombApi.get(`/user/${userId}/deployments`);
    return response.data as DeploymentRecord[];
    
  } catch (error: any) {
    console.log('GET USER DEPLOYMENTS ERROR:', error?.response?.data);
    return [];
  }
}
