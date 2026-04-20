import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { transformAsync } from '@babel/core'

const jsxSourceLocationFiles = /\.[jt]sx?$/

function reactSourceLocationPlugin() {
  return {
    name: 'react-jsx-source-location',
    apply: 'serve' as const,
    enforce: 'pre' as const,
    async transform(code: string, id: string) {
      const [filename] = id.split('?')

      if (!filename || filename.includes('/node_modules/') || !jsxSourceLocationFiles.test(filename)) {
        return null
      }

      const transformed = await transformAsync(code, {
        filename,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        parserOpts: {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        },
        plugins: ['babel-plugin-transform-react-jsx-data-source-code-location'],
      })

      if (!transformed?.code) {
        return null
      }

      return {
        code: transformed.code,
        map: transformed.map ?? null,
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // React 19 no longer exposes the source internals that older click-to-component
    // helpers depended on, so inject explicit JSX source metadata during dev.
    reactSourceLocationPlugin(),
    react(),
  ],
})
