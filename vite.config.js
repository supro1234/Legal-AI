import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs'

// Post-build: copy HTML to correct extension paths and fix asset references
function fixExtensionPaths() {
  return {
    name: 'fix-extension-paths',
    closeBundle() {
      // Fix popup HTML
      const popupDir = 'dist/popup'
      if (!existsSync(popupDir)) mkdirSync(popupDir, { recursive: true })
      if (existsSync('dist/src/popup/index.html')) {
        // The HTML already has ./ relative paths from base: './'
        copyFileSync('dist/src/popup/index.html', 'dist/popup/index.html')
      }

      // Fix options HTML
      const optsDir = 'dist/options'
      if (!existsSync(optsDir)) mkdirSync(optsDir, { recursive: true })
      if (existsSync('dist/src/options/index.html')) {
        copyFileSync('dist/src/options/index.html', 'dist/options/index.html')
      }

      console.log('[LexGuard] ✓ Extension HTML files placed in dist/popup/ and dist/options/')
    },
  }
}

function redirectRoot() {
  return {
    name: 'redirect-root',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/') {
          res.writeHead(302, { Location: '/src/popup/index.html' })
          res.end()
        } else {
          next()
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    fixExtensionPaths(),
    redirectRoot(),
  ],
  // base './' ensures asset references use relative paths (required for Chrome extensions)
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup:      resolve(__dirname, 'src/popup/index.html'),
        options:    resolve(__dirname, 'src/options/index.html'),
        background: resolve(__dirname, 'src/background/service_worker.js'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background/service_worker.js'
          return '[name]/[name]-bundle.js'
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    target: 'esnext',
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
