import { ombApi } from '@/core/auth/api/ombApi';

export async function createModule({ name, technicalName, description, isPublic, user_id, author, category }: {
  name: string;
  technicalName: string;
  description?: string;
  isPublic: boolean;
  user_id: number;
  author?: string;
  category?: string;
}) {
  try {
    const response = await ombApi.post('/modules', {
      name,
      technicalName,
      description,
      isPublic,
      user_id,
      author,
      category,
    });
    // Notificar a otras pantallas que los módulos han cambiado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('modules-updated'));
    }
    return { data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { error: error.response.data || error.response.statusText, status: error.response.status };
    }
    return { error: 'Network error', status: 0 };
  }
}
