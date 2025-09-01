import { defineStore } from 'pinia'

interface User {
  id: number
  nombre_usuario: string
  correo_electronico: string
  rol: string
  // otras propiedades del usuario
}

interface LoginData {
  nombre_usuario: string
  contrasenia: string
}

interface RegisterData {
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  correo_electronico: string
  nro_celular: string
  contrasenia1: string
  contrasenia2: string
  tipo: number
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    isAuthenticated: false,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async login(credentials: LoginData) {
  this.loading = true
  this.error = null

  try {
    const config = useRuntimeConfig()
    // Tipamos la respuesta esperada:
    const { data, error } = await useFetch<{ token: string; usuario: User }>(
      `${config.public.apiBase}/auth/login`,
      {
        method: 'POST',
        body: credentials
      }
    )

    if (error.value) {
      throw new Error(error.value.message || 'Error en el login')
    }

    if (data.value) {
      this.token = data.value.token
      this.user = data.value.usuario
      this.isAuthenticated = true

      // Guardar en localStorage solo si token no es null
      if (this.token) {
        localStorage.setItem('token', this.token)
      }
      if (this.user) {
        localStorage.setItem('user', JSON.stringify(this.user))
      }
    }
  } catch (error: any) {
    this.error = error.message
    throw error
  } finally {
    this.loading = false
  }
},
    
    async register(userData: RegisterData) {
      this.loading = true
      this.error = null
      
      try {
        const config = useRuntimeConfig()
        const { data, error } = await useFetch(`${config.public.apiBase}/sus/postGuardarUsuario`, {
          method: 'POST',
          body: userData
        })
        
        if (error.value) {
          throw new Error(error.value.message || 'Error en el registro')
        }
        
        return data.value
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async recoverPassword(email: string) {
      try {
        const config = useRuntimeConfig()
        const { error } = await useFetch(`${config.public.apiBase}/auth/recover`, {
          method: 'POST',
          body: { email }
        })
        
        if (error.value) {
          throw new Error(error.value.message || 'Error al recuperar contraseña')
        }
      } catch (error: any) {
        throw error
      }
    },
    
    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    
    // Verificar autenticación al cargar la app
    initialize() {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      
      if (token && userStr) {
        this.token = token
        this.user = JSON.parse(userStr)
        this.isAuthenticated = true
      }
    }
  }
})