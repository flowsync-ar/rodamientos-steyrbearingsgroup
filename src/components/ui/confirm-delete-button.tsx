'use client'

import { useState, useTransition, type ReactElement } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface Props {
  action: () => Promise<void>
  itemLabel: string
  triggerClassName?: string
  triggerLabel?: string
  trigger?: ReactElement
}

export function ConfirmDeleteButton({
  action,
  itemLabel,
  triggerClassName,
  triggerLabel = 'Eliminar',
  trigger,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await action()
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <button
              type="button"
              className={
                triggerClassName ??
                'p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors'
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar {itemLabel}?</DialogTitle>
          <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Eliminando…' : triggerLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
