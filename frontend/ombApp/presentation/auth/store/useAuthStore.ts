import { authLogin } from '@/core/auth/actions/auth-actions';
import { User } from '@/core/interface/user';
import { StorageAdapter } from '@/helpers/adapters/secure-storage.adapter';
import { create } from 'zustand';

// Zustand gestión de estado global para autenticación
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'checking';

interface AuthState {
  status: AuthStatus;
  user?: User;

  login: (email: string, password: string) => Promise<string | true>;
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'checking',
  user: undefined,

  // llama al login y actualiza el estado global
  login: async (email: string, password: string) => {
    const result = await authLogin(email, password);
    if (!result || (result as any).error) {
      let errorMsg = 'Credenciales incorrectas';
      if (result && (result as any).error) {
        if ((result as any).error === 'User not found') errorMsg = 'Usuario no encontrado';
        else if ((result as any).error === 'Invalid password') errorMsg = 'Contraseña incorrecta';
        else errorMsg = (result as any).error;
      }
      set({ status: 'unauthenticated', user: undefined });
      // Devolver el mensaje para mostrarlo en el componente
      return errorMsg;
    }
    set({ status: 'authenticated', user: result as any });
    await StorageAdapter.setItem('user', JSON.stringify(result));
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
