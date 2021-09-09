import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import leanix from 'vite-plugin-lxr'
import eslintPlugin from 'vite-plugin-eslint'
import graphql from '@rollup/plugin-graphql'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    leanix(),
    eslintPlugin({ fix: true }),
    graphql()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
