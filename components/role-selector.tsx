'use client'

import React from "react"
import Image from "next/image"
import { ChefHat, ClipboardList, Settings, Utensils, ChevronRight, QrCode } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Role {
  id: string
  nombre: string
  descripcion: string
  icon: React.ReactNode
}

const ROLES: Role[] = [
  {
    id: 'cliente',
    nombre: 'Cliente',
    descripcion: 'Vista del menu al escanear QR',
    icon: <QrCode className="h-4 w-4" />,
  },
  {
    id: 'admin',
    nombre: 'Administrador',
    descripcion: 'Gestion de menu, pedidos y config',
    icon: <Settings className="h-4 w-4" />,
  },
  {
    id: 'mesero',
    nombre: 'Mesero / Atencion',
    descripcion: 'Mesas, pedidos y entregas',
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    id: 'cocina_a',
    nombre: 'Cocina A',
    descripcion: 'KDS - Tacos y carnes',
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    id: 'cocina_b',
    nombre: 'Cocina B',
    descripcion: 'KDS - Antojitos y complementos',
    icon: <Utensils className="h-4 w-4" />,
  },
]

interface RoleSelectorProps {
  onSelectRole: (roleId: string) => void
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt="Pa' Que Vos Veais" 
            width={56} 
            height={56}
            className="mb-1"
            priority
          />
          <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
            Sistema de Pedidos
          </p>
        </div>
      </header>

      {/* Role Selection */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-sm mx-auto">
          <h2 className="text-xs font-medium text-muted-foreground mb-3 text-center">
            Selecciona tu rol para continuar
          </h2>
          
          <div className="space-y-1.5">
            {ROLES.map((role) => (
              <Card
                key={role.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 border border-border bg-card"
                onClick={() => onSelectRole(role.id)}
              >
                <CardContent className="flex items-center gap-3 p-2.5">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center text-primary">
                    {role.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-foreground">
                      {role.nombre}
                    </h3>
                    <p className="text-muted-foreground text-[10px] leading-tight">
                      {role.descripcion}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-2">
        <p className="text-center text-[10px] text-muted-foreground">
          CDMX - Sistema de gestion de pedidos
        </p>
      </footer>
    </div>
  )
}
