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
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
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
import { PromocionesManager } from './promociones-manager'
import { ReservationsManager } from './reservations-manager'
import { ShiftsManager } from './shifts-manager'
import { FacturasManager } from './facturas-manager'
import { SucursalesManager } from './sucursales-manager'
import { CrmManager } from './crm-manager'
import { EtiquetasManager } from './etiquetas-manager'
import { useApp } from '@/lib/context'
import { CalendarDays, Clock4, FileText, Building2, Contact, Tag, Salad } from 'lucide-react'

type AdminScreen = 'reports' | 'menu' | 'orders' | 'inventory' | 'users' | 'config' | 'qr' | 'delivery' | 'refunds' | 'closing' | 'history' | 'audit' | 'orders-history' | 'rewards' | 'promociones' | 'reservations' | 'shifts' | 'facturas' | 'sucursales' | 'crm' | 'etiquetas'

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
  const { theme, setTheme } = useTheme()
  
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
        { id: 'promociones', label: 'Promociones', icon: <Tag className="h-5 w-5" /> },
        { id: 'etiquetas', label: 'Etiquetas', icon: <Salad className="h-5 w-5" /> },
        { id: 'refunds', label: 'Reembolsos', icon: <RotateCcw className="h-5 w-5" />, badge: pendingRefundsCount > 0 ? pendingRefundsCount : undefined },
        { id: 'reservations', label: 'Reservaciones', icon: <CalendarDays className="h-5 w-5" /> },
        { id: 'shifts', label: 'Turnos', icon: <Clock4 className="h-5 w-5" /> },
        { id: 'facturas', label: 'Facturas CFDI', icon: <FileText className="h-5 w-5" /> },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'qr', label: 'Codigos QR', icon: <QrCode className="h-5 w-5" /> },
        { id: 'history', label: 'Historial Mesas', icon: <History className="h-5 w-5" /> },
        { id: 'audit', label: 'Bitácora', icon: <LayoutDashboard className="h-5 w-5" /> },
        { id: 'users', label: 'Usuarios', icon: <Users className="h-5 w-5" /> },
        { id: 'sucursales', label: 'Sucursales', icon: <Building2 className="h-5 w-5" /> },
        { id: 'crm', label: 'CRM Clientes', icon: <Contact className="h-5 w-5" /> },
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
            <button
              className="ml-auto p-1.5 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-primary-foreground" /> : <Moon className="h-4 w-4 text-primary-foreground" />}
            </button>
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
          {screen === 'promociones' && <PromocionesManager />}
          {screen === 'etiquetas' && <EtiquetasManager />}
          {screen === 'refunds' && <RefundsManager />}
          {screen === 'qr' && <QRManager />}
          {screen === 'history' && <TableHistory />}
          {screen === 'audit' && <AuditLogViewer />}
          {screen === 'users' && <UsersManager />}
          {screen === 'config' && <ConfigManager />}
          {screen === 'reservations' && (
            <div className="p-4">
              <h2 className="text-base font-bold mb-4">Reservaciones</h2>
              <ReservationsManager />
            </div>
          )}
          {screen === 'shifts' && (
            <div className="p-4">
              <h2 className="text-base font-bold mb-4">Turnos de Empleados</h2>
              <ShiftsManager />
            </div>
          )}
          {screen === 'facturas' && (
            <div className="p-4">
              <h2 className="text-base font-bold mb-4">Solicitudes de Factura</h2>
              <FacturasManager />
            </div>
          )}
          {screen === 'sucursales' && (
            <div className="p-4">
              <h2 className="text-base font-bold mb-4">Sucursales</h2>
              <SucursalesManager />
            </div>
          )}
          {screen === 'crm' && (
            <div className="p-4">
              <h2 className="text-base font-bold mb-4">CRM Clientes</h2>
              <CrmManager />
            </div>
          )}
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
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative h-9 w-9 shrink-0">
                  <Image src="/logo.png" alt="Pa' Que Vos Veais" fill className="object-contain" priority />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-foreground leading-tight truncate">Administrador</span>
                  <span className="text-xs text-muted-foreground truncate">Panel de control</span>
                </div>
                {/* Dark mode toggle prominente en header */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all shrink-0",
                    theme === 'dark'
                      ? "bg-slate-700 text-yellow-300 hover:bg-slate-600"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  )}
                  title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              </div>
            ) : (
              <div className="flex flex-col w-full items-center gap-2">
                <div className="relative h-8 w-8">
                  <Image src="/logo.png" alt="Pa' Que Vos Veais" fill className="object-contain" priority />
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    theme === 'dark' ? "bg-slate-700 text-yellow-300" : "bg-amber-100 text-amber-700"
                  )}
                >
                  {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-1 [&>[data-radix-scroll-area-viewport]]:scrollbar-thin">
            <nav className="flex flex-col gap-0.5 px-2">
              {navGroups.map((group, groupIndex) => (
                <React.Fragment key={group.title}>
                  {!sidebarCollapsed && (
                    <div className="px-3 pt-3 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.title}
                      </span>
                    </div>
                  )}
                  {sidebarCollapsed && groupIndex > 0 && (
                    <Separator className="my-1" />
                  )}
                  {group.items.map((item) => {
                    const isActive = screen === item.id
                    const button = (
                      <Button
                        key={item.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2.5 h-9 transition-colors",
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
            {screen === 'promociones' && <PromocionesManager />}
          {screen === 'etiquetas' && <EtiquetasManager />}
            {screen === 'refunds' && <RefundsManager />}
            {screen === 'qr' && <QRManager />}
            {screen === 'history' && <TableHistory />}
            {screen === 'audit' && <AuditLogViewer />}
            {screen === 'users' && <UsersManager />}
            {screen === 'config' && <ConfigManager />}
            {screen === 'reservations' && <ReservationsManager />}
            {screen === 'shifts' && <ShiftsManager />}
            {screen === 'facturas' && <FacturasManager />}
            {screen === 'sucursales' && <SucursalesManager />}
            {screen === 'crm' && (
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">CRM Clientes</h2>
                <CrmManager />
              </div>
            )}
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
