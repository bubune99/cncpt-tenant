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
  dts: false, // Disabled due to React 18/19 type conflicts - using manual declarations
  tsconfig: 'tsconfig.build.json',
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    // React ecosystem
    'react',
    'react-dom',
    // Next.js
    'next',
    'next/navigation',
    'next/image',
    'next/link',
    'next/headers',
    'next/server',
    // Auth
    '@stackframe/stack',
    '@stackframe/stack-shared',
    // Database
    '@prisma/client',
    '.prisma/client/default',
    'prisma',
    // Puck editor
    '@measured/puck',
    '@puckeditor/plugin-ai',
    // AI SDK
    '@ai-sdk/anthropic',
    '@ai-sdk/google',
    '@ai-sdk/openai',
    'ai',
    // Other heavy dependencies that should be peer deps
    'stripe',
    'shippo',
    'sonner',
    'zod',
    'lucide-react',
    'date-fns',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    // Radix UI - externalize all
    /^@radix-ui\/.*/,
  ],
  noExternal: [], // Don't bundle any node_modules
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
