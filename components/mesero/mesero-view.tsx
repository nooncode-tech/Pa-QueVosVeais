'use client'

import React from "react"

import { useState } from 'react'
import { LayoutGrid, Package, Bell } from 'lucide-react'
import { useApp } from '@/lib/context'
import { BackButton } from '@/components/back-button'
import { TablesGrid } from './tables-grid'
import { TableSession } from './table-session'
import { DeliveryBoard } from './delivery-board'
import { WaiterCallsPanel } from './waiter-calls-panel'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

type MeseroScreen = 'tables' | 'session' | 'deliveries' | 'calls'

interface MeseroViewProps {
  onBack: () => void
}

export function MeseroView({ onBack }: MeseroViewProps) {
  const { getPendingCalls } = useApp()
  const [screen, setScreen] = useState<MeseroScreen>('tables')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  
  const pendingCallsCount = getPendingCalls().length
  
  const handleSelectTable = (mesa: number) => {
    setSelectedTable(mesa)
    setScreen('session')
  }
  
  const handleBackFromSession = () => {
    setSelectedTable(null)
    setScreen('tables')
  }
  
  const tabs: { key: MeseroScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'tables', label: 'Mesas', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { key: 'calls', label: 'Llamadas', icon: <Bell className="h-3.5 w-3.5" />, badge: pendingCallsCount },
    { key: 'deliveries', label: 'Entregas', icon: <Package className="h-3.5 w-3.5" /> },
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
                Mesero / Atencion
              </h1>
            </div>
            
            {/* Quick notification badge */}
            {pendingCallsCount > 0 && screen !== 'calls' && (
              <button 
                onClick={() => setScreen('calls')}
                className="ml-auto flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-full animate-pulse"
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{pendingCallsCount} llamada{pendingCallsCount !== 1 ? 's' : ''}</span>
              </button>
            )}
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => tab.key !== 'tables' ? setScreen(tab.key) : setScreen('tables')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors relative ${
                  (tab.key === 'tables' && (screen === 'tables' || screen === 'session')) || screen === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <Badge 
                    className={`ml-1 h-4 min-w-[16px] px-1 text-[10px] ${
                      screen === tab.key 
                        ? 'bg-white text-primary' 
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {screen === 'session' && selectedTable ? (
          <TableSession mesa={selectedTable} onBack={handleBackFromSession} />
        ) : screen === 'deliveries' ? (
          <DeliveryBoard />
        ) : screen === 'calls' ? (
          <WaiterCallsPanel />
        ) : (
          <TablesGrid onSelectTable={handleSelectTable} />
        )}
      </main>
    </div>
  )
}
