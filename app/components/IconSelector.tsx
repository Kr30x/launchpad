'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface IconSelectorProps {
  onSelectIcon: (iconName: string) => void
  triggerText: string
}

export function IconSelector({ onSelectIcon, triggerText }: IconSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelectIcon = (iconName: string) => {
    onSelectIcon(iconName)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select an Icon</DialogTitle>
          <DialogDescription>
            Choose an icon for your tile from the list below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-8 gap-2 py-4">
          {Object.entries(LucideIcons).map(([name, Icon]) => {
            if (typeof Icon !== 'function') return null;
            const IconComponent = Icon as React.ComponentType<any>;
            
            return (
              <Button
                key={name}
                variant="outline"
                className="h-10 w-10 p-0"
                onClick={() => handleSelectIcon(name)}
              >
                <IconComponent className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

