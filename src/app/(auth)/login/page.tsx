
'use client'

import { signIn } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { useActionState, useState } from 'react'

type ActionState = { error?: string; success?: boolean } | null

export default function LoginPage() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(
    signIn as (state: ActionState, payload: FormData) => Promise<ActionState>,
    null
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription className="mt-1">Ingresá tu email y contraseña para acceder a tu cuenta.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/forgot-password" className="text-sm underline text-muted-foreground">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="underline">
            Registrarse
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
