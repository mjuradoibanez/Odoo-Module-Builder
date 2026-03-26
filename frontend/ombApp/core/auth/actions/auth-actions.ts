import { User } from '@/core/interface/user';
import { ombApi } from '../api/ombApi';

export interface RegisterUserDto {
  email: string;
  password: string;
  username?: string;
}

export const authRegister = async (data: RegisterUserDto): Promise<User | null> => {
  try {
    const body: any = {
      email: data.email,
      password: data.password,
    };
    if (data.username) {
      body.username = data.username;
    }
    const response = await ombApi.post<User>('/users', body);
    return response.data;
  } catch (error: any) {
    console.log('REGISTER ERROR:', error?.response?.data);
    return null;
  }
};

export const authLogin = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    const { data } = await ombApi.post<User>('/login', { email, password });

    console.log('API RESPONSE:', data);
    return data;
  
  } catch (error: any) {
    console.log('Login error:', error.response?.data || error.message);
  
    return null;
  }
};
