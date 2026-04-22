import { ombApi } from '@/core/auth/api/ombApi';

export interface UpdateFieldInput {
  name?: string;
  technicalName?: string;
  type?: string;
  required?: boolean;
  uniqueField?: boolean;
  relationModel?: string | null;
  relationField?: string | null;
  model_id?: number;
}

export async function updateField(id: number, input: UpdateFieldInput) {
  try {
    const response = await ombApi.put(`/fields/${id}`, input);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
}
