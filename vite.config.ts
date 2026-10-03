import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      },
      output: {
        manualChunks: {
          'vendor-crypto': ['zod'],
          'vendor-idb': ['idb'],
          'vendor-qrcode': ['qrcode']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  preview: {
    port: 4173
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@components': resolve(__dirname, 'src/components'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '8.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    'process.env.LICENSE_SECRET_KEY': JSON.stringify(process.env.LICENSE_SECRET_KEY || 'ff-ob54-benz-secret-key-2026'),
    'process.env.ADMIN_PASSWORD_HASH': JSON.stringify(process.env.ADMIN_PASSWORD_HASH || 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'),
    'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version || '8.0.0'),
    'process.env.UPSTASH_REDIS_REST_URL': JSON.stringify(process.env.UPSTASH_REDIS_REST_URL || ''),
    'process.env.UPSTASH_REDIS_REST_TOKEN': JSON.stringify(process.env.UPSTASH_REDIS_REST_TOKEN || ''),
    'process.env.NEXT_PUBLIC_SENTRY_DSN': JSON.stringify(process.env.NEXT_PUBLIC_SENTRY_DSN || '')
  }
});