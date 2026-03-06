import { Callout, CodeBlock, Tabs, StepList, Step } from "./mdx-client-components"

// Re-export client components for direct use
export { Callout, CodeBlock, Tabs, StepList, Step }

// --- Standard MDX component overrides ---
// This file is a Server Component (no "use client") so it can be used
// with next-mdx-remote/rsc's <MDXRemote> without wrapper manifest errors.

export const mdxComponents = {
  Callout,
  CodeBlock,
  Tabs,
  StepList,
  Step,
  h1: (props: any) => (
    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-8 mb-4 first:mt-0" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-2" {...props} />
  ),
  h4: (props: any) => (
    <h4 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2" {...props} />
  ),
  p: (props: any) => (
    <p className="text-gray-600 dark:text-gray-300 leading-7 mb-4" {...props} />
  ),
  ul: (props: any) => (
    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 mb-4 ml-2" {...props} />
  ),
  ol: (props: any) => (
    <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-300 mb-4 ml-2" {...props} />
  ),
  li: (props: any) => <li className="leading-7" {...props} />,
  a: (props: any) => (
    <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />
  ),
  strong: (props: any) => (
    <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
  ),
  code: (props: any) => (
    <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-gray-800 dark:text-gray-200" {...props} />
  ),
  pre: ({ children }: any) => {
    const code = children?.props?.children || ""
    const className = children?.props?.className || ""
    return <CodeBlock className={className}>{code}</CodeBlock>
  },
  table: (props: any) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: any) => (
    <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
  ),
  th: (props: any) => (
    <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" {...props} />
  ),
  td: (props: any) => (
    <td className="px-4 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" {...props} />
  ),
  hr: () => <hr className="my-8 border-gray-200 dark:border-gray-700" />,
  blockquote: (props: any) => (
    <blockquote className="my-4 pl-4 border-l-4 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 italic" {...props} />
  ),
}
