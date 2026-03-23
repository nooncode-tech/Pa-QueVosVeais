'use client'

import { useState, useEffect } from 'react'
import { AppProvider, useApp } from '@/lib/context'
import { LoginScreen } from '@/components/auth/login-screen'
import { ClienteView } from '@/components/cliente/cliente-view'
import { MeseroView } from '@/components/mesero/mesero-view'
import { KDSView } from '@/components/kds/kds-view'
import { AdminView } from '@/components/admin/admin-view'
import { ErrorBoundary } from '@/components/error-boundary'
import type { UserRole } from '@/lib/store'

type AppView = 'login' | 'cliente' | 'admin' | 'mesero' | 'cocina_a' | 'cocina_b'

function AppContent() {
  const { currentUser, currentTable, setCurrentTable, logout } = useApp()
  const [view, setView] = useState<AppView>('login')
  const [clienteMesa, setClienteMesa] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Wait for client mount to avoid hydration mismatch from browser extensions
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Check for table parameter (QR code)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mesa = params.get('mesa')
    if (mesa) {
      const mesaNum = parseInt(mesa)
      setClienteMesa(mesaNum)
      setCurrentTable(mesaNum)
      setView('cliente')
    }
  }, [setCurrentTable])
  
  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (currentUser && view === 'login') {
      setView(currentUser.role)
    }
  }, [currentUser, view])
  
  const handleLoginSuccess = (role: UserRole) => {
    setView(role)
  }
  
  const handleClienteAccess = () => {
    // Simulate QR scan for table 1
    setClienteMesa(1)
    setCurrentTable(1)
    setView('cliente')
  }
  
  const handleLogout = () => {
    logout()
    setView('login')
    setClienteMesa(null)
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname)
  }
  
  const handleClienteExit = () => {
    setClienteMesa(null)
    setCurrentTable(null)
    setView('login')
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname)
  }
  
  // Show nothing until mounted to avoid hydration mismatch from browser extensions (fdprocessedid)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Cliente view (QR access - no login required)
  if (view === 'cliente' && clienteMesa) {
    return (
      <ErrorBoundary label="Vista Cliente">
        <ClienteView mesa={clienteMesa} onBack={handleClienteExit} />
      </ErrorBoundary>
    )
  }

  // Login screen
  if (view === 'login' || !currentUser) {
    return (
      <ErrorBoundary label="Login">
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onClienteAccess={handleClienteAccess}
        />
      </ErrorBoundary>
    )
  }

  // Role-based views (require login)
  switch (view) {
    case 'admin':
      if (currentUser.role !== 'admin') { setView('login'); return null }
      return (
        <ErrorBoundary label="Admin">
          <AdminView onBack={handleLogout} />
        </ErrorBoundary>
      )

    case 'mesero':
      if (currentUser.role !== 'mesero') { setView('login'); return null }
      return (
        <ErrorBoundary label="Mesero">
          <MeseroView onBack={handleLogout} />
        </ErrorBoundary>
      )

    case 'cocina_a':
      if (currentUser.role !== 'cocina_a') { setView('login'); return null }
      return (
        <ErrorBoundary label="Cocina A">
          <KDSView kitchen="a" onBack={handleLogout} />
        </ErrorBoundary>
      )

    case 'cocina_b':
      if (currentUser.role !== 'cocina_b') { setView('login'); return null }
      return (
        <ErrorBoundary label="Cocina B">
          <KDSView kitchen="b" onBack={handleLogout} />
        </ErrorBoundary>
      )

    default:
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onClienteAccess={handleClienteAccess}
        />
      )
  }
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
