// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  components: true,

  modules: ['@pinia/nuxt'],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      apiBase: process.env.VITE_API_BASE_URL_LOGIN || 'https://trendvoto.bispace.site/api/',
      apiBase2: process.env.NUXT_PUBLIC_API_CHAT || "http://localhost:3011",
      geminiApiKey: process.env.GEMINI_API_KEY || ''
    },
  },
    app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  },
  pages: true,
  css: ['~/assets/css/main.css'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/css/variables.scss" as *;'
        }
      }
    }
  }

  
})
