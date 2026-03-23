'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Shield, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function SetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [alreadySetup, setAlreadySetup] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    username: '',
    password: '',
  })

  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then((data: { needsSetup: boolean }) => {
        if (!data.needsSetup) setAlreadySetup(true)
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.username.trim() || !form.password.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Error desconocido')
      } else {
        setDone(true)
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (alreadySetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="p-8 space-y-4">
            <Shield className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-lg font-bold">Setup ya completado</h2>
            <p className="text-sm text-muted-foreground">
              Ya existe al menos un administrador. Inicia sesión con tus credenciales.
            </p>
            <Button className="w-full" onClick={() => router.push('/')}>
              Ir al login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="p-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold">¡Administrador creado!</h2>
            <p className="text-sm text-muted-foreground">
              Usuario <strong>@{form.username}</strong> listo. Ahora puedes iniciar sesión y crear el resto de los usuarios desde el panel.
            </p>
            <Button className="w-full" onClick={() => router.push('/')}>
              Ir al login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-16 w-16">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">Configuración inicial</h1>
            <p className="text-sm text-muted-foreground">Crea el primer administrador del sistema</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Primer administrador</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Este usuario tendrá acceso total al sistema. Después podrá crear meseros y cocineros desde el panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs">Nombre completo</Label>
                <Input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Juan García"
                  className="h-9 text-sm"
                  autoComplete="name"
                />
              </div>

              <div>
                <Label className="text-xs">Usuario</Label>
                <Input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                  placeholder="admin"
                  className="h-9 text-sm"
                  autoComplete="username"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Solo letras y números, sin espacios
                </p>
              </div>

              <div>
                <Label className="text-xs">Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className="h-9 text-sm pr-9"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !form.nombre.trim() || !form.username.trim() || form.password.length < 8}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creando...</>
                ) : (
                  'Crear administrador'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          Esta página desaparecerá automáticamente después del primer setup.
        </p>
      </div>
    </div>
  )
}
