"use client"

import { ReactNode, useState } from "react"
import { AlertCircle, Info, Lightbulb } from "lucide-react"

// --- Callout ---

const calloutStyles = {
  info: {
    container: "border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10",
    icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
  },
  warning: {
    container: "border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10",
    icon: <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />,
  },
  tip: {
    container: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10",
    icon: <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
  },
}

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip"
  children: ReactNode
}) {
  const style = calloutStyles[type] || calloutStyles.info
  return (
    <div className={`my-4 rounded-lg border p-4 flex gap-3 ${style.container}`}>
      {style.icon}
      <div className="text-sm text-gray-700 dark:text-gray-200 [&>p]:m-0">{children}</div>
    </div>
  )
}

// --- CodeBlock ---

export function CodeBlock({ children, className }: { children: string; className?: string }) {
  const language = className?.replace("language-", "") || ""
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {language && (
        <div className="px-4 py-1.5 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {language}
        </div>
      )}
      <pre className="p-4 overflow-x-auto bg-gray-50 dark:bg-gray-900 text-sm">
        <code className={`font-mono text-gray-800 dark:text-gray-200 ${className || ""}`}>
          {children}
        </code>
      </pre>
    </div>
  )
}

// --- Tabs ---

export function Tabs({ children, labels }: { children: ReactNode[]; labels: string[] }) {
  const [active, setActive] = useState(0)
  const items = Array.isArray(children) ? children : [children]

  return (
    <div className="my-4">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {labels.map((label, i) => (
          <button
            key={label}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              active === i
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="pt-4">{items[active]}</div>
    </div>
  )
}

// --- StepList ---

export function StepList({ children }: { children: ReactNode }) {
  return <div className="my-4 space-y-4 [counter-reset:step]">{children}</div>
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 [counter-increment:step]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center text-sm font-medium before:content-[counter(step)]" />
      <div className="flex-1 pt-0.5">
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
        <div className="text-sm text-gray-600 dark:text-gray-300">{children}</div>
      </div>
    </div>
  )
}

// --- Standard MDX component overrides ---

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
