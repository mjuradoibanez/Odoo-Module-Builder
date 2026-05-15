import { ombApi } from '@/core/auth/api/ombApi';

export interface CreateFieldInput {
  name: string;
  technicalName: string;
  type: string;
  required?: boolean;
  uniqueField?: boolean;
  relationModel?: string | null;
  relationField?: string | null;
  model_id: number;
}

export async function createField(input: CreateFieldInput) {
  try {
    const response = await ombApi.post('/fields', input);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
}
