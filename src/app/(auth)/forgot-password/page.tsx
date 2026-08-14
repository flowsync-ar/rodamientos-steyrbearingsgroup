
'use client'

import { resetPassword } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { useActionState } from 'react'

type ActionState = { error?: string; success?: boolean } | null

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    resetPassword,
    null
  )

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
          <CardTitle>¿Olvidaste tu contraseña?</CardTitle>
          <CardDescription className="mt-1">
            Ingresá tu email y te enviamos un link para restablecerla.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {state?.success ? (
          <p className="text-sm text-muted-foreground text-center">
            Si el email existe en nuestro sistema, te enviamos un link para restablecer tu
            contraseña.
          </p>
        ) : (
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="vos@empresa.com"
                required
                autoComplete="email"
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Enviando…' : 'Enviar link de recuperación'}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
