'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Clock, Play, Check, LogOut, ListOrdered, ChefHat, CircleCheck, AlertTriangle } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { 
  formatTime, 
  getChannelLabel, 
  getTimeDiff, 
  type Order, 
  type KitchenStatus 
} from '@/lib/store'

interface KDSViewProps {
  kitchen: 'a' | 'b'
  onBack: () => void
}

type KDSTab = 'queue' | 'preparing' | 'ready'

export function KDSView({ kitchen, onBack }: KDSViewProps) {
  const { orders, updateKitchenStatus } = useApp()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState<KDSTab>('queue')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])
  
  const kitchenKey = kitchen === 'a' ? 'cocina_a' : 'cocina_b'
  const kitchenName = kitchen === 'a' ? 'Cocina A' : 'Cocina B'
  const kitchenDesc = kitchen === 'a' ? 'Tacos y carnes' : 'Antojitos y complementos'
  
  const relevantOrders = orders.filter(order => {
    if (order.status === 'entregado' || order.status === 'cancelado') return false
    if (order.claimedByKitchen && order.claimedByKitchen !== kitchenKey) return false
    const hasItems = order.items.some(
      item => item.menuItem.cocina === kitchenKey || item.menuItem.cocina === 'ambas'
    )
    return hasItems
  })
  
  const sortByArrivalTime = (orders: Order[]) => {
    return [...orders].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }
  
  const queueOrders = sortByArrivalTime(relevantOrders.filter(o => {
    const status = kitchen === 'a' ? o.cocinaAStatus : o.cocinaBStatus
    return status === 'en_cola'
  }))
  
  const preparingOrders = sortByArrivalTime(relevantOrders.filter(o => {
    const status = kitchen === 'a' ? o.cocinaAStatus : o.cocinaBStatus
    return status === 'preparando'
  }))
  
  const readyOrders = sortByArrivalTime(relevantOrders.filter(o => {
    const status = kitchen === 'a' ? o.cocinaAStatus : o.cocinaBStatus
    return status === 'listo'
  }))
  
  const handleStartOrder = (orderId: string) => {
    updateKitchenStatus(orderId, kitchen, 'preparando')
  }
  
  const handleCompleteOrder = (orderId: string) => {
    updateKitchenStatus(orderId, kitchen, 'listo')
  }
  
  const getOrderItems = (order: Order) => {
    return order.items.filter(
      item => item.menuItem.cocina === kitchenKey || item.menuItem.cocina === 'ambas'
    )
  }
  
  const getTimeColor = (createdAt: Date) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000 / 60)
    if (minutes >= 15) return 'text-destructive'
    if (minutes >= 10) return 'text-amber-500'
    return 'text-muted-foreground'
  }

  const getTimeBgColor = (createdAt: Date) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000 / 60)
    if (minutes >= 15) return 'bg-destructive/10 border-destructive'
    if (minutes >= 10) return 'bg-amber-500/10 border-amber-500'
    return ''
  }

  const getActiveOrders = () => {
    switch (activeTab) {
      case 'queue': return queueOrders
      case 'preparing': return preparingOrders
      case 'ready': return readyOrders
    }
  }

  const navItems = [
    { 
      id: 'queue' as const, 
      label: 'En Cola', 
      icon: <ListOrdered className="h-5 w-5" />,
      count: queueOrders.length,
      bgColor: 'bg-muted',
      activeColor: 'bg-muted-foreground'
    },
    { 
      id: 'preparing' as const, 
      label: 'Preparando', 
      icon: <ChefHat className="h-5 w-5" />, 
      count: preparingOrders.length,
      bgColor: 'bg-primary/10',
      activeColor: 'bg-primary'
    },
    { 
      id: 'ready' as const, 
      label: 'Listos', 
      icon: <CircleCheck className="h-5 w-5" />,
      count: readyOrders.length,
      bgColor: 'bg-success/10',
      activeColor: 'bg-success'
    },
  ]
  
  // Mobile Layout
  const MobileLayout = () => (
    <div className="min-h-screen bg-background flex flex-col md:hidden">
      {/* Mobile Header */}
      <header className="bg-foreground text-background px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-background/70 hover:text-background hover:bg-background/10"
              onClick={onBack}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Salir
            </Button>
            <div className="border-l border-background/20 pl-2 flex items-center gap-1.5 min-w-0">
              <Image src="/logo.png" alt="Pa' Que Vos Veais" width={24} height={24} className="w-6 h-6 object-contain flex-shrink-0 brightness-0 invert" priority />
              <div className="min-w-0">
                <h1 className="text-xs font-bold truncate">{kitchenName}</h1>
                <p className="text-background/70 text-[10px] truncate">{kitchenDesc}</p>
              </div>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-mono font-bold">
              {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="bg-background border-b border-border p-2">
        <div className="flex gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors",
                activeTab === item.id
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-foreground'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] h-5 min-w-5 px-1.5",
                  activeTab === item.id 
                    ? 'bg-background/20 text-background' 
                    : item.count > 0 ? item.bgColor : ''
                )}
              >
                {item.count}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Content */}
      <main className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-3">
          {getActiveOrders().map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              items={getOrderItems(order)}
              status={activeTab === 'queue' ? 'en_cola' : activeTab === 'preparing' ? 'preparando' : 'listo'}
              timeColor={getTimeColor(order.createdAt)}
              timeBgColor={getTimeBgColor(order.createdAt)}
              onStart={activeTab === 'queue' ? () => handleStartOrder(order.id) : undefined}
              onComplete={activeTab === 'preparing' ? () => handleCompleteOrder(order.id) : undefined}
              priorityIndex={activeTab === 'queue' ? index : undefined}
              large
            />
          ))}
          
          {getActiveOrders().length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
                {activeTab === 'queue' && <ListOrdered className="h-8 w-8 text-muted-foreground" />}
                {activeTab === 'preparing' && <ChefHat className="h-8 w-8 text-muted-foreground" />}
                {activeTab === 'ready' && <CircleCheck className="h-8 w-8 text-muted-foreground" />}
              </div>
              <p className="text-base text-muted-foreground font-medium">
                {activeTab === 'queue' && 'Sin ordenes en cola'}
                {activeTab === 'preparing' && 'Nada preparandose'}
                {activeTab === 'ready' && 'Sin ordenes listas'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )

  // Desktop Layout with Sidebar
  const DesktopLayout = () => (
    <TooltipProvider delayDuration={0}>
      <div className="hidden md:flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex h-full flex-col border-r border-border bg-foreground text-background transition-all duration-300",
            sidebarCollapsed ? "w-20" : "w-64"
          )}
        >
          {/* Logo / Brand */}
          <div className="flex h-20 items-center border-b border-background/10 px-4">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3 flex-1">
                <div className="relative h-12 w-12 shrink-0 bg-background/10 rounded-xl p-2">
                  <Image 
                    src="/logo.png" 
                    alt="Pa' Que Vos Veais" 
                    fill
                    className="object-contain brightness-0 invert p-1" 
                    priority 
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold leading-tight truncate">{kitchenName}</span>
                  <span className="text-sm text-background/60 truncate">{kitchenDesc}</span>
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-center">
                <div className="relative h-10 w-10 bg-background/10 rounded-lg p-1.5">
                  <Image 
                    src="/logo.png" 
                    alt="Pa' Que Vos Veais" 
                    fill
                    className="object-contain brightness-0 invert" 
                    priority 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Time Display */}
          <div className={cn(
            "py-4 border-b border-background/10",
            sidebarCollapsed ? "px-2" : "px-4"
          )}>
            <div className={cn(
              "text-center",
              sidebarCollapsed ? "" : "text-left"
            )}>
              <p className="text-2xl font-mono font-bold">
                {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {!sidebarCollapsed && (
                <p className="text-xs text-background/60 mt-1">
                  {relevantOrders.length} orden{relevantOrders.length !== 1 ? 'es' : ''} pendiente{relevantOrders.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id
                const button = (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-14 transition-colors text-background/70 hover:text-background hover:bg-background/10",
                      sidebarCollapsed && "justify-center px-0",
                      isActive && "bg-background/15 text-background"
                    )}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                        <Badge
                          className={cn(
                            "h-6 min-w-6 px-2 text-sm",
                            isActive ? "bg-background text-foreground" : "bg-background/20 text-background"
                          )}
                        >
                          {item.count}
                        </Badge>
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
                          {item.count > 0 && (
                            <span className={cn(
                              "absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium bg-background text-foreground"
                            )}>
                              {item.count}
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {item.label}
                        <Badge>{item.count}</Badge>
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return button
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-background/10 p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 text-background/60 hover:text-destructive hover:bg-destructive/20",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                  onClick={onBack}
                >
                  <LogOut className="h-4 w-4" />
                  {!sidebarCollapsed && <span className="text-sm">Salir</span>}
                </Button>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right">Salir</TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {/* Main Content - Order Cards Grid */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Stats Bar */}
          <div className="shrink-0 border-b border-border bg-card px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cola: <strong className="text-foreground">{queueOrders.length}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Preparando: <strong className="text-primary">{preparingOrders.length}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Listos: <strong className="text-success">{readyOrders.length}</strong></span>
                </div>
              </div>
              {queueOrders.some(o => {
                const minutes = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 1000 / 60)
                return minutes >= 10
              }) && (
                <div className="flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Ordenes con espera larga</span>
                </div>
              )}
            </div>
          </div>

          {/* Orders Grid */}
          <div className="flex-1 overflow-auto p-6">
            {getActiveOrders().length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
                    {activeTab === 'queue' && <ListOrdered className="h-10 w-10 text-muted-foreground" />}
                    {activeTab === 'preparing' && <ChefHat className="h-10 w-10 text-muted-foreground" />}
                    {activeTab === 'ready' && <CircleCheck className="h-10 w-10 text-muted-foreground" />}
                  </div>
                  <p className="text-lg text-muted-foreground font-medium">
                    {activeTab === 'queue' && 'Sin ordenes en cola'}
                    {activeTab === 'preparing' && 'Nada preparandose'}
                    {activeTab === 'ready' && 'Sin ordenes listas'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {getActiveOrders().map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    items={getOrderItems(order)}
                    status={activeTab === 'queue' ? 'en_cola' : activeTab === 'preparing' ? 'preparando' : 'listo'}
                    timeColor={getTimeColor(order.createdAt)}
                    timeBgColor={getTimeBgColor(order.createdAt)}
                    onStart={activeTab === 'queue' ? () => handleStartOrder(order.id) : undefined}
                    onComplete={activeTab === 'preparing' ? () => handleCompleteOrder(order.id) : undefined}
                    priorityIndex={activeTab === 'queue' ? index : undefined}
                    large
                  />
                ))}
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

interface OrderCardProps {
  order: Order
  items: Order['items']
  status: KitchenStatus
  timeColor: string
  timeBgColor?: string
  onStart?: () => void
  onComplete?: () => void
  priorityIndex?: number
  large?: boolean
}

function OrderCard({ order, items, status, timeColor, timeBgColor, onStart, onComplete, priorityIndex, large }: OrderCardProps) {
  return (
    <Card className={cn(
      "border-2 transition-all",
      status === 'preparando' && "border-primary bg-primary/5",
      status === 'listo' && "border-success bg-success/5",
      status === 'en_cola' && timeBgColor,
      status === 'en_cola' && !timeBgColor && "border-border"
    )}>
      <CardHeader className={cn("pb-2", large ? "p-4" : "p-2.5")}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {priorityIndex !== undefined && status === 'en_cola' && (
                <span className={cn(
                  "font-bold px-2 py-1 rounded",
                  large ? "text-sm" : "text-[10px]",
                  priorityIndex === 0 ? 'bg-destructive text-destructive-foreground' :
                  priorityIndex < 3 ? 'bg-amber-500 text-white' :
                  'bg-muted text-muted-foreground'
                )}>
                  #{priorityIndex + 1}
                </span>
              )}
              <CardTitle className={cn(large ? "text-2xl" : "text-base", "font-bold")}>
                #{order.numero}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className={cn(large ? "text-xs h-5" : "text-[9px] h-3.5", "px-1.5")}>
                {getChannelLabel(order.canal)}
              </Badge>
              {order.mesa && (
                <span className={cn(large ? "text-xs" : "text-[9px]", "text-muted-foreground")}>
                  Mesa {order.mesa}
                </span>
              )}
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1 font-medium rounded-lg px-2 py-1",
            large ? "text-sm" : "text-[10px]",
            timeColor,
            timeBgColor ? "bg-transparent" : "bg-muted/50"
          )}>
            <Clock className={cn(large ? "h-4 w-4" : "h-2.5 w-2.5")} />
            {getTimeDiff(order.createdAt)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={cn(large ? "p-4 pt-0" : "p-2.5 pt-0")}>
        {/* Items */}
        <ul className={cn("space-y-2", large ? "mb-4" : "mb-2")}>
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <span className={cn(
                "bg-foreground text-background font-bold rounded flex-shrink-0 flex items-center justify-center",
                large ? "text-sm px-2 py-1 min-w-8" : "text-[9px] px-1 py-0.5"
              )}>
                {item.cantidad}x
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-foreground", large ? "text-base" : "text-xs")}>
                  {item.menuItem.nombre}
                </p>
                {item.notas && (
                  <p className={cn("text-primary font-medium italic", large ? "text-sm mt-0.5" : "text-[9px]")}>
                    {item.notas}
                  </p>
                )}
                {item.extras && item.extras.length > 0 && (
                  <p className={cn("text-muted-foreground", large ? "text-sm" : "text-[9px]")}>
                    + {item.extras.map(e => e.nombre).join(', ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        
        {/* Action Buttons */}
        {status === 'en_cola' && onStart && (
          <Button
            className={cn(
              "w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground",
              large ? "h-12 text-base" : "h-8 text-xs"
            )}
            onClick={onStart}
          >
            <Play className={cn(large ? "h-5 w-5 mr-2" : "h-3 w-3 mr-1")} />
            INICIAR
          </Button>
        )}
        
        {status === 'preparando' && onComplete && (
          <Button
            className={cn(
              "w-full font-bold bg-success hover:bg-success/90 text-success-foreground",
              large ? "h-12 text-base" : "h-8 text-xs"
            )}
            onClick={onComplete}
          >
            <Check className={cn(large ? "h-5 w-5 mr-2" : "h-3 w-3 mr-1")} />
            LISTO
          </Button>
        )}
        
        {status === 'listo' && (
          <div className={cn(
            "bg-success/20 text-success text-center rounded font-medium",
            large ? "py-3 text-sm" : "py-1.5 text-[10px]"
          )}>
            Esperando entrega
          </div>
        )}
      </CardContent>
    </Card>
  )
}
