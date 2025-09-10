import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Firebase Storage API 프록시 설정 (기존 googleapis.com 도메인)
      '/firebase-storage': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/firebase-storage/, ''),
        configure: (proxy, options) => {
          // CORS 헤더 추가
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        }
      },
      // 새로운 Firebase Storage 도메인용 프록시 (.firebasestorage.app)
      '/firebase-storage-new': {
        target: 'https://ideaunionlab.firebasestorage.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/firebase-storage-new/, ''),
        configure: (proxy, options) => {
          // CORS 헤더 추가
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        }
      },
      // Stability AI API 프록시 설정 (추가 보안)
      '/stability-api': {
        target: 'https://api.stability.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/stability-api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        }
      }
    }
  }
})
