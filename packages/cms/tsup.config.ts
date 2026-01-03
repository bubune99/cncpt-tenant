import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    // Main entry point
    index: 'src/index.ts',
    // Admin components
    'admin/index': 'src/exports/admin.ts',
    // UI components
    'ui/index': 'src/exports/ui.ts',
    // Hooks
    'hooks/index': 'src/exports/hooks.ts',
    // Lib utilities
    'lib/index': 'src/exports/lib.ts',
    // Puck components
    'puck/index': 'src/exports/puck.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'next',
    'next/navigation',
    'next/image',
    'next/link',
    '@stackframe/stack',
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  // Replace @/ paths with relative paths during build
  esbuildPlugins: [],
})
