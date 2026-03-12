import { authLogin } from '@/core/auth/actions/auth-actions';
import { User } from '@/core/interface/user';
import { StorageAdapter } from '@/helpers/adapters/secure-storage.adapter';
import { create } from 'zustand';

// Zustand gestión de estado global para autenticación
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'checking';

interface AuthState {
  status: AuthStatus;
  user?: User;

  login: (email: string, password: string) => Promise<boolean>;
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'checking',
  user: undefined,

  // llama al login y actualiza el estado global
  login: async (email: string, password: string) => {

    const user = await authLogin(email, password);

    if (!user) {
      set({ status: 'unauthenticated', user: undefined });
      return false;
    }

    set({ status: 'authenticated', user });

    // Persistir en AsyncStorage (solo guarda strings)
    await StorageAdapter.setItem('user', JSON.stringify(user));

    return true;
  },

  // se ejecuta al iniciar la app
  checkStatus: async () => {
    const storedUser = await StorageAdapter.getItem('user');

    if (!storedUser) {
      set({ status: 'unauthenticated', user: undefined });
      return;
    }

    set({
      status: 'authenticated',
      user: JSON.parse(storedUser)
    });
  },

  // eliminar estado global
  logout: async () => {
    await StorageAdapter.deleteItem('user');
    set({ status: 'unauthenticated', user: undefined });
  },

}));
