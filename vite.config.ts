import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'firebase/app': path.resolve(__dirname, 'src/mysql-client/app.ts'),
        'firebase/auth': path.resolve(__dirname, 'src/mysql-client/auth.ts'),
        'firebase/firestore': path.resolve(__dirname, 'src/mysql-client/firestore.ts'),
        'firebase/app-check': path.resolve(__dirname, 'src/mysql-client/app-check.ts'),
        'firebase/analytics': path.resolve(__dirname, 'src/mysql-client/analytics.ts'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // ↓ Add this block only
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});