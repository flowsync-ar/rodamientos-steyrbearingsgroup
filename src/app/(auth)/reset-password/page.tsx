
'use client'

import { updatePassword } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { useActionState, useState } from 'react'

type ActionState = { error?: string; success?: boolean } | null

export default function ResetPasswordPage() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    updatePassword,
    null
  )
  const [mismatch, setMismatch] = useState(false)

  function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setMismatch(true)
      return
    }

    setMismatch(false)
    action(formData)
  }

  return (
    <Card>
      <CardHeader className="items-center text-center space-y-3">
        <Image
          src="/logo-transparente.png"
          alt="Logo"
          width={150}
          height={50}
          className="object-contain"
        />
        <div>
          <CardTitle>Restablecer contraseña</CardTitle>
          <CardDescription className="mt-1">Elegí tu nueva contraseña.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {mismatch && (
            <p className="text-sm text-destructive">Las contraseñas no coinciden.</p>
          )}
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Guardando…' : 'Guardar nueva contraseña'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
