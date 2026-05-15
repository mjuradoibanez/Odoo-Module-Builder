import { authLogin, authRegister } from '@/core/auth/actions/auth-actions';
import { User } from '@/core/interface/user';
import { useState } from 'react';

export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const loggedUser = await authLogin(email, password);

      // solo User válido si no tiene la propiedad 'error'
      if (loggedUser && typeof loggedUser === 'object' && !('error' in loggedUser)) {
        setUser(loggedUser as User);
        setError(null);
        return true;

      } else {
        setUser(null);
        setError('Credenciales incorrectas');
        return false;
      }
    } catch (e) {
      setError('Error al iniciar sesión');
      setUser(null);
    
      return false;
    
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const registeredUser = await authRegister(data);
    
      setUser(registeredUser);
    
      if (!registeredUser) setError('No se pudo registrar el usuario');
      return !!registeredUser;
    
    } catch (e) {
      setError('Error al registrar');
      setUser(null);
    
      return false;
    
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return { user, loading, error, login, register, logout };
}
