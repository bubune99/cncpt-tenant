"use client";

import { StackProvider as BaseStackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/lib/stack-client";

interface StackProviderProps {
  children: React.ReactNode;
}

export function StackProvider({ children }: StackProviderProps) {
  return (
    <BaseStackProvider app={stackClientApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </BaseStackProvider>
  );
}
