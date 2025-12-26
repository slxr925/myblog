import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 核心库
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }

          // Radix UI 组件库
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui-vendor';
          }

          // Markdown 编辑器和相关库
          if (id.includes('node_modules/@uiw/react-md-editor') ||
            id.includes('node_modules/@uiw/react-markdown-preview') ||
            id.includes('node_modules/react-markdown') ||
            id.includes('node_modules/remark-') ||
            id.includes('node_modules/rehype-') ||
            id.includes('node_modules/react-syntax-highlighter')) {
            return 'markdown-editor';
          }

          // 图表库
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }

          // 其他UI库和工具
          if (id.includes('node_modules/framer-motion') ||
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/emoji-picker-react')) {
            return 'ui-vendor';
          }

          // axios 和工具库
          if (id.includes('node_modules/axios') ||
            id.includes('node_modules/date-fns') ||
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/class-variance-authority')) {
            return 'utils-vendor';
          }
        }
      }
    },
    // 提高 chunk 大小警告阈值（单位：KB）
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（可选，用于调试）
    sourcemap: false,
    // 使用 esbuild 进行压缩（更快）
    minify: 'esbuild'
  }
})