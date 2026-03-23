'use client'

import React from "react"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, AlertCircle, Settings2 } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type UserRole } from '@/lib/store'

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole) => void
  onClienteAccess: () => void
}

export function LoginScreen({ onLoginSuccess, onClienteAccess }: LoginScreenProps) {
  const { login } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then((data: { needsSetup: boolean }) => setNeedsSetup(data.needsSetup))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const user = await login(username, password)
      if (user) {
        onLoginSuccess(user.role)
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border py-6">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt="Pa' Que Vos Veáis" 
            width={72} 
            height={72}
            className="mb-2"
            priority
          />
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Sistema de Pedidos
          </p>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-6">
          <Card className="border border-border">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Iniciar Sesión</CardTitle>
              <p className="text-xs text-muted-foreground">
                Ingresa tus credenciales para acceder
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-xs font-medium text-foreground">
                    Usuario
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-medium text-foreground">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pr-10"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-2 rounded">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Ingresando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Iniciar Sesión
                    </span>
                  )}
                </Button>
              </form>

            </CardContent>
          </Card>

          {/* Client Access */}
          <Card className="border border-primary/30 bg-primary/5">
            <CardContent className="py-4 text-center">
              <button
                type="button"
                onClick={onClienteAccess}
                className="w-full text-left"
              >
                <p className="text-sm font-medium text-foreground text-center">
                  Acceso como Cliente
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Simular escaneo de QR para ver el menu
                </p>
              </button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-3 space-y-1">
        {needsSetup && (
          <p className="text-center">
            <Link
              href="/setup"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
            >
              <Settings2 className="h-3 w-3" />
              Primera vez? Configura el administrador
            </Link>
          </p>
        )}
        <p className="text-center text-[10px] text-muted-foreground">
          CDMX - Sistema de gestión de pedidos v2.0
        </p>
      </footer>
    </div>
  )
}
