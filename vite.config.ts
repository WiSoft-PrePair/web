import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 7400,
    strictPort: true,
    // 개발 중에는 /api 를 member-service로 넘긴다 (같은 출처로 보여서 CORS 설정이 필요 없다)
    proxy: { '/api': 'http://localhost:7200' },
  },
})
