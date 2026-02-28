'use client'

import React from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { 
  Package, 
  Archive, 
  Users, 
  Settings, 
  TrendingUp,
  QrCode,
  Truck,
  RotateCcw,
  Receipt,
  UtensilsCrossed,
  History
} from 'lucide-react'
import { BackButton } from '@/components/back-button'
import { MenuManager } from './menu-manager'
import { OrdersManager } from './orders-manager'
import { InventoryManager } from './inventory-manager'
import { UsersManager } from './users-manager'
import { ConfigManager } from './config-manager'
import { ReportsManager } from './reports-manager'
import { QRManager } from './qr-manager'
import { DeliveryZonesManager } from './delivery-zones-manager'
import { RefundsManager } from './refunds-manager'
import { DailyClosing } from './daily-closing'
import { TableHistory } from './table-history'

type AdminScreen = 'reports' | 'menu' | 'orders' | 'inventory' | 'users' | 'config' | 'qr' | 'delivery' | 'refunds' | 'closing' | 'history'

interface AdminViewProps {
  onBack: () => void
}

export function AdminView({ onBack }: AdminViewProps) {
  const [screen, setScreen] = useState<AdminScreen>('reports')
  
  const tabs: { key: AdminScreen; label: string; icon: React.ReactNode }[] = [
    { key: 'reports', label: 'Reportes', icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { key: 'closing', label: 'Corte', icon: <Receipt className="h-3.5 w-3.5" /> },
    { key: 'orders', label: 'Pedidos', icon: <Package className="h-3.5 w-3.5" /> },
    { key: 'menu', label: 'Menu', icon: <UtensilsCrossed className="h-3.5 w-3.5" /> },
    { key: 'inventory', label: 'Inventario', icon: <Archive className="h-3.5 w-3.5" /> },
    { key: 'delivery', label: 'Zonas', icon: <Truck className="h-3.5 w-3.5" /> },
    { key: 'refunds', label: 'Reembolsos', icon: <RotateCcw className="h-3.5 w-3.5" /> },
    { key: 'qr', label: 'QR Mesas', icon: <QrCode className="h-3.5 w-3.5" /> },
    { key: 'history', label: 'Historial', icon: <History className="h-3.5 w-3.5" /> },
    { key: 'users', label: 'Usuarios', icon: <Users className="h-3.5 w-3.5" /> },
    { key: 'config', label: 'Config', icon: <Settings className="h-3.5 w-3.5" /> },
  ]
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <BackButton onClick={onBack} label="Salir" />
            <div className="border-l border-border pl-2 flex items-center gap-1.5">
              <Image src="/logo.png" alt="Pa' Que Vos Veais" width={24} height={24} className="w-6 h-6 object-contain" priority />
              <h1 className="text-xs font-bold text-foreground">
                Administrador
              </h1>
            </div>
          </div>
          
          {/* Navigation Tabs - Scrollable on mobile */}
          <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-none pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setScreen(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  screen === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-3">
        {screen === 'reports' && <ReportsManager />}
        {screen === 'closing' && <DailyClosing />}
        {screen === 'orders' && <OrdersManager />}
        {screen === 'menu' && <MenuManager />}
        {screen === 'inventory' && <InventoryManager />}
        {screen === 'delivery' && <DeliveryZonesManager />}
        {screen === 'refunds' && <RefundsManager />}
        {screen === 'qr' && <QRManager />}
        {screen === 'history' && <TableHistory />}
        {screen === 'users' && <UsersManager />}
        {screen === 'config' && <ConfigManager />}
      </main>
    </div>
  )
}
