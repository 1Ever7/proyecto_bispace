// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { checkAuth, isAuthenticated } = useAuth();
  
  // Para rutas que requieren autenticación
  if (to.meta.requiresAuth) {
    // Si no está autenticado, verificar si hay token válido
    if (!isAuthenticated.value) {
      const isValid = await checkAuth();
      
      if (!isValid) {
        return navigateTo('/login');
      }
    }
  }
  
  // Para rutas de login/register, redirigir si ya está autenticado
  if (to.meta.requiresGuest && isAuthenticated.value) {
    return navigateTo('/dashboard');
  }
});