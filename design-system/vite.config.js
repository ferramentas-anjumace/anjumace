import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build multi-página: um HTML por rota compartilhável, cada um com as suas
// meta tags OG (crawlers de preview não executam JS — a SPA sozinha mostrava
// a thumb da lista de espera em todos os links). O roteamento real continua
// no App.jsx; o vercel.json aponta cada rota pro seu HTML.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        singular: resolve(__dirname, 'singular.html'),
        obrigadoTemplo: resolve(__dirname, 'obrigado-templo.html'),
        obrigadoSingular: resolve(__dirname, 'obrigado-singular.html'),
      },
    },
  },
})
