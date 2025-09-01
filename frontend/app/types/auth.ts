// types/auth.ts
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface AuthState {
  token: string | null;
  usuario: Usuario | null;
}
