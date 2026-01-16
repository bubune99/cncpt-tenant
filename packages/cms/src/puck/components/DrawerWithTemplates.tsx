'use client'

/**
 * Drawer Override with Templates Tab
 *
 * Wraps the default Puck components drawer with a tabbed interface
 * to add Templates functionality while preserving the original UI.
 */

import React from 'react'
import type { Config } from '@measured/puck'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { TemplatesPanel } from './TemplatesPanel'
import { Layers, LayoutTemplate } from 'lucide-react'

interface DrawerWithTemplatesProps {
  children: React.ReactNode
  currentConfig: string
  puckConfig: Config
}

export function DrawerWithTemplates({
  children,
  currentConfig,
  puckConfig,
}: DrawerWithTemplatesProps) {
  return (
    <Tabs defaultValue="components" className="flex h-full flex-col">
      <div className="border-b px-2 py-1.5">
        <TabsList className="h-8 w-full grid grid-cols-2">
          <TabsTrigger value="components" className="text-xs h-7">
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            Components
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs h-7">
            <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" />
            Templates
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="components" className="flex-1 overflow-auto m-0 p-0">
        {children}
      </TabsContent>
      <TabsContent value="templates" className="flex-1 overflow-hidden m-0 p-0">
        <TemplatesPanel currentConfig={currentConfig} puckConfig={puckConfig} />
      </TabsContent>
    </Tabs>
  )
}

export default DrawerWithTemplates
