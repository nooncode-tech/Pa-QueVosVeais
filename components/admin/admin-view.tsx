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
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Cog,
  ClipboardList,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
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
import { AuditLogViewer } from './audit-log-viewer'
import { OrdersHistory } from './orders-history'
import { RewardsManager } from './rewards-manager'
import { useApp } from '@/lib/context'

type AdminScreen = 'reports' | 'menu' | 'orders' | 'inventory' | 'users' | 'config' | 'qr' | 'delivery' | 'refunds' | 'closing' | 'history' | 'audit' | 'orders-history' | 'rewards'

interface AdminViewProps {
  onBack: () => void
}

interface NavItem {
  id: AdminScreen
  label: string
  icon: React.ReactNode
  badge?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export function AdminView({ onBack }: AdminViewProps) {
  const [screen, setScreen] = useState<AdminScreen>('reports')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { orders, refunds } = useApp()
  
  // Calculate badges
  const pendingOrdersCount = orders.filter(o => 
    o.status !== 'entregado' && o.status !== 'cancelado'
  ).length
  const pendingRefundsCount = refunds.length
  
  const navGroups: NavGroup[] = [
    {
      title: 'Principal',
      items: [
        { id: 'reports', label: 'Reportes', icon: <TrendingUp className="h-5 w-5" /> },
        { id: 'closing', label: 'Corte de Caja', icon: <Receipt className="h-5 w-5" /> },
        { id: 'orders', label: 'Pedidos', icon: <Package className="h-5 w-5" />, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
        { id: 'orders-history', label: 'Historial Pedidos', icon: <ClipboardList className="h-5 w-5" /> },
      ]
    },
    {
      title: 'Operaciones',
      items: [
        { id: 'menu', label: 'Menu', icon: <UtensilsCrossed className="h-5 w-5" /> },
        { id: 'inventory', label: 'Inventario', icon: <Archive className="h-5 w-5" /> },
        { id: 'delivery', label: 'Zonas de Entrega', icon: <Truck className="h-5 w-5" /> },
        { id: 'rewards', label: 'Recompensas', icon: <Star className="h-5 w-5" /> },
        { id: 'refunds', label: 'Reembolsos', icon: <RotateCcw className="h-5 w-5" />, badge: pendingRefundsCount > 0 ? pendingRefundsCount : undefined },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'qr', label: 'Codigos QR', icon: <QrCode className="h-5 w-5" /> },
        { id: 'history', label: 'Historial Mesas', icon: <History className="h-5 w-5" /> },
        { id: 'audit', label: 'Bitácora', icon: <LayoutDashboard className="h-5 w-5" /> },
        { id: 'users', label: 'Usuarios', icon: <Users className="h-5 w-5" /> },
        { id: 'config', label: 'Configuracion', icon: <Settings className="h-5 w-5" /> },
      ]
    },
  ]

  const getScreenTitle = () => {
    const allItems = navGroups.flatMap(g => g.items)
    const item = allItems.find(i => i.id === screen)
    return item?.label || 'Admin'
  }

  // Mobile layout
  const MobileLayout = () => (
    <div className="min-h-screen bg-background flex flex-col md:hidden">
      {/* Mobile Header - Orange bg with white elements */}
      <header className="sticky top-0 z-50 bg-primary shadow-sm">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={onBack}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Salir
            </Button>
            <div className="border-l border-primary-foreground/30 pl-2 flex items-center gap-1.5">
              <Image src="/logo.png" alt="Pa' Que Vos Veais" width={24} height={24} className="w-6 h-6 object-contain" priority />
              <h1 className="text-xs font-bold text-primary-foreground">
                Administrador
              </h1>
            </div>
          </div>
          
          {/* Navigation Tabs - Scrollable on mobile */}
          <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-none pb-1">
            {navGroups.flatMap(g => g.items).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors relative",
                  screen === tab.id
                    ? 'bg-white text-primary'
                    : 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <Badge className={cn(
                    "h-4 min-w-4 px-1 text-[10px] ml-1",
                    screen === tab.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-white text-primary"
                  )}>
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile Content - Clean minimal layout */}
      <main className="flex-1 overflow-auto">
        <div className="bg-card min-h-full">
          {screen === 'reports' && <ReportsManager />}
          {screen === 'closing' && <DailyClosing />}
          {screen === 'orders' && <OrdersManager />}
          {screen === 'orders-history' && <OrdersHistory />}
          {screen === 'menu' && <MenuManager />}
          {screen === 'inventory' && <InventoryManager />}
          {screen === 'delivery' && <DeliveryZonesManager />}
          {screen === 'rewards' && <RewardsManager />}
          {screen === 'refunds' && <RefundsManager />}
          {screen === 'qr' && <QRManager />}
          {screen === 'history' && <TableHistory />}
          {screen === 'audit' && <AuditLogViewer />}
          {screen === 'users' && <UsersManager />}
          {screen === 'config' && <ConfigManager />}
        </div>
      </main>
    </div>
  )

  // Desktop layout with sidebar
  const DesktopLayout = () => (
    <TooltipProvider delayDuration={0}>
      <div className="hidden md:flex h-screen w-full overflow-hidden bg-primary">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Logo / Brand */}
          <div className="flex h-16 items-center border-b border-border px-3">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3 flex-1">
                <div className="relative h-10 w-10 shrink-0">
                  <Image 
                    src="/logo.png" 
                    alt="Pa' Que Vos Veais" 
                    fill
                    className="object-contain" 
                    priority 
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-foreground leading-tight truncate">Administrador</span>
                  <span className="text-xs text-muted-foreground truncate">Panel de control</span>
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-center">
                <div className="relative h-8 w-8">
                  <Image 
                    src="/logo.png" 
                    alt="Pa' Que Vos Veais" 
                    fill
                    className="object-contain" 
                    priority 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="flex flex-col gap-1 px-2">
              {navGroups.map((group, groupIndex) => (
                <React.Fragment key={group.title}>
                  {!sidebarCollapsed && (
                    <div className="px-3 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.title}
                      </span>
                    </div>
                  )}
                  {sidebarCollapsed && groupIndex > 0 && (
                    <Separator className="my-2" />
                  )}
                  {group.items.map((item) => {
                    const isActive = screen === item.id
                    const button = (
                      <Button
                        key={item.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-11 transition-colors",
                          sidebarCollapsed && "justify-center px-0",
                          isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                        )}
                        onClick={() => setScreen(item.id)}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left text-sm">{item.label}</span>
                            {item.badge !== undefined && (
                              <Badge className="h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Button>
                    )

                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              {button}
                              {item.badge !== undefined && (
                                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium bg-primary text-primary-foreground">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-2">
                            {item.label}
                            {item.badge !== undefined && (
                              <Badge className="h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground">
                                {item.badge}
                              </Badge>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return button
                  })}
                </React.Fragment>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border p-2 space-y-1">
            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-3 h-9 text-muted-foreground",
                sidebarCollapsed && "justify-center px-0"
              )}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm">Colapsar</span>
                </>
              )}
            </Button>
            
            {/* Logout */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                  onClick={onBack}
                >
                  <LogOut className="h-4 w-4" />
                  {!sidebarCollapsed && <span className="text-sm">Cerrar Sesion</span>}
                </Button>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right">Cerrar Sesion</TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold text-foreground">{getScreenTitle()}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cog className="h-4 w-4" />
              <span>Panel de Administracion</span>
            </div>
          </header>

          {/* Content - White bg for content area */}
          <div className="flex-1 overflow-auto p-4 bg-card rounded-tl-xl">
            {screen === 'reports' && <ReportsManager />}
            {screen === 'closing' && <DailyClosing />}
            {screen === 'orders' && <OrdersManager />}
            {screen === 'orders-history' && <OrdersHistory />}
            {screen === 'menu' && <MenuManager />}
            {screen === 'inventory' && <InventoryManager />}
            {screen === 'delivery' && <DeliveryZonesManager />}
            {screen === 'rewards' && <RewardsManager />}
            {screen === 'refunds' && <RefundsManager />}
            {screen === 'qr' && <QRManager />}
            {screen === 'history' && <TableHistory />}
            {screen === 'audit' && <AuditLogViewer />}
            {screen === 'users' && <UsersManager />}
            {screen === 'config' && <ConfigManager />}
          </div>
        </main>
      </div>
    </TooltipProvider>
  )

  return (
    <>
      <MobileLayout />
      <DesktopLayout />
    </>
  )
}
