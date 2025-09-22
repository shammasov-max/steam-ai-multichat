import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        target: 'esnext',
        minify: false,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@packages/isomorphic': resolve(__dirname, '../isomorphic/src'),
        },
    },
    server: {
        port: 5173,
        open: false,
    },
    optimizeDeps: {
        include: ['effect', '@effect/schema', '@reduxjs/toolkit', 'redux'],
        exclude: ['@packages/isomorphic'],
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
})