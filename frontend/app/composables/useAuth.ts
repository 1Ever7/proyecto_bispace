// composables/useAuth.ts
import { useState, useCookie, useRuntimeConfig } from '#app';

type LoginResponse = {
  token: string;
  usuario: any; 
  plan?: string;
};

type RegisterResponse = {
  ok: boolean;
  [key: string]: any;
};

export const useAuth = () => {
  const user = useState('user', () => null);
  const isAuthenticated = useState('isAuthenticated', () => false);
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'http://trendvoto.bispace.site/api/';

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await useFetch<LoginResponse>(`${apiBase}auth/login`, {
        method: 'POST',
        body: {
          nombre_usuario: username,
          contrasenia: password
        },
        onRequestError: (error) => {
          console.error('Error en la solicitud:', error);
          throw new Error('Error de conexión');
        },
        onResponseError: (error) => {
          console.error('Error en la respuesta:', error);
          throw new Error('Credenciales inválidas');
        }
      });

      if (error.value) {
        console.error('Error logging in:', error.value);
        return false;
      }

      if (data.value) {
        const token = useCookie('token');
        token.value = data.value.token;

        user.value = data.value.usuario;
        isAuthenticated.value = true;

        // Guardar también en localStorage para persistencia (solo en cliente)
        if (process.client) {
          localStorage.setItem('token', data.value.token);
          localStorage.setItem('usuario', JSON.stringify(data.value.usuario));
          if (data.value.plan) {
            localStorage.setItem('plan', data.value.plan);
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const { data, error } = await useFetch<RegisterResponse>(`${apiBase}suscripcion`, {
        method: 'POST',
        body: userData
      });

      if (error.value) {
        console.error('Error registering:', error.value);
        return false;
      }

      if (data.value?.ok) {
        // Guardar usuario después de la suscripción
        const { data: userDataResp, error: userError } = await useFetch<RegisterResponse>(`${apiBase}sus/postGuardarUsuario`, {
          method: 'POST',
          body: userData
        });

        if (userError.value) {
          console.error('Error saving user:', userError.value);
          return false;
        }

        return userDataResp.value?.ok || false;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    const token = useCookie('token');
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;

    // Limpiar localStorage también (solo en cliente)
    if (process.client) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('plan');
      localStorage.removeItem('rememberedUser');
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    const token = useCookie('token');

    if (!token.value) {
      return false;
    }

    try {
      const { data, error } = await useFetch<LoginResponse>(`${apiBase}auth/renew`, {
        headers: {
          'x-token': token.value
        }
      });

      if (error.value) {
        console.error('Error renewing token:', error.value);
        return false;
      }

      if (data.value) {
        token.value = data.value.token;
        user.value = data.value.usuario;
        isAuthenticated.value = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  };
};