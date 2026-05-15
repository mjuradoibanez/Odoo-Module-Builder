import { User } from './user';

export interface Module {
  id: number;
  name: string;
  technicalName: string;
  description?: string | null;
  version: string;
  author?: string | null;
  category?: string;
  createdAt: string;
  user: User;
  isPublic?: boolean;
}
