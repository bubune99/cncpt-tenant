'use client'

/**
 * Puck Editor Wrapper with Compositional Layout
 *
 * Uses Puck's compositional API to create a custom layout with:
 * - Left sidebar with Components and Templates tabs
 * - Center preview area
 * - Right sidebar with Outline and Fields
 */

import React from 'react'
import { Puck, type Config, type Data } from '@measured/puck'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { TemplatesPanel } from './TemplatesPanel'
import { Layers, LayoutTemplate } from 'lucide-react'

interface PuckEditorWrapperProps {
  config: Config
  data: Data
  onPublish: (data: Data) => void
  plugins?: Array<{ name: string }>
  currentConfig: string
}

export function PuckEditorWrapper({
  config,
  data,
  onPublish,
  plugins = [],
  currentConfig,
}: PuckEditorWrapperProps) {
  return (
    <Puck
      config={config}
      data={data}
      onPublish={onPublish}
      plugins={plugins}
    >
      <div className="puck-editor-layout h-full grid grid-cols-[280px_1fr_280px]">
        {/* Left Sidebar - Components & Templates */}
        <div className="border-r bg-muted/30 flex flex-col overflow-hidden">
          <Tabs defaultValue="components" className="flex flex-col h-full">
            <div className="border-b px-2 py-2">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="components" className="text-xs">
                  <Layers className="mr-1 h-3 w-3" />
                  Components
                </TabsTrigger>
                <TabsTrigger value="templates" className="text-xs">
                  <LayoutTemplate className="mr-1 h-3 w-3" />
                  Templates
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="components" className="flex-1 overflow-auto m-0 p-0">
              <Puck.Components />
            </TabsContent>
            <TabsContent value="templates" className="flex-1 overflow-hidden m-0 p-0">
              <TemplatesPanel currentConfig={currentConfig} puckConfig={config} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Preview */}
        <div className="flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
          <Puck.Preview />
        </div>

        {/* Right Sidebar - Outline & Fields */}
        <div className="border-l bg-muted/30 flex flex-col overflow-hidden">
          <Tabs defaultValue="fields" className="flex flex-col h-full">
            <div className="border-b px-2 py-2">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="fields" className="text-xs">
                  Fields
                </TabsTrigger>
                <TabsTrigger value="outline" className="text-xs">
                  Outline
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="fields" className="flex-1 overflow-auto m-0">
              <Puck.Fields />
            </TabsContent>
            <TabsContent value="outline" className="flex-1 overflow-auto m-0">
              <Puck.Outline />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Puck>
  )
}

export default PuckEditorWrapper
