/**
 * VariantGridModal Component
 * Full-screen modal wrapper for the variant grid editor
 */

'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { VariantGridEditor } from './index'

interface VariantGridModalProps {
  productId: string
  productTitle?: string
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export function VariantGridModal({
  productId,
  productTitle,
  isOpen,
  onClose,
  onSave,
}: VariantGridModalProps) {
  const handleSave = () => {
    onSave?.()
    // Optionally close after save
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {productTitle ? `Variants - ${productTitle}` : 'Variant Editor'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-4">
          <VariantGridEditor
            productId={productId}
            mode="modal"
            onSave={handleSave}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VariantGridModal
