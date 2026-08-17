import { RegistrationForm } from '@/components/features/clients/RegistrationForm'
import Image from 'next/image'

export const metadata = {
  title: 'Crear cuenta — Rodamientos',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-white p-12">
        <Image
          src="/logo-blanco.png"
          alt="Steyr Bearing Group"
          width={360}
          height={120}
          className="object-contain w-full max-w-xs"
        />
      </div>
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <RegistrationForm />
      </div>
    </div>
  )
}
