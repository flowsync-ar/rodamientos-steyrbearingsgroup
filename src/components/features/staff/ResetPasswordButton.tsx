'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Loader2 } from 'lucide-react'
import { resetVendedorPassword } from '@/lib/staff/actions'

interface Props {
  vendedorId: string
  email: string
  fullName: string
}

export function ResetPasswordButton({ vendedorId, email, fullName }: Props) {
  const [isPending, setIsPending] = useState(false)

  async function handleClick() {
    setIsPending(true)
    const result = await resetVendedorPassword(vendedorId, email, fullName)
    setIsPending(false)
    if (result.success) {
      toast.success(`Se envió el email de blanqueo de contraseña a ${email}.`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <KeyRound className="w-4 h-4" />
      )}
    </button>
  )
}
