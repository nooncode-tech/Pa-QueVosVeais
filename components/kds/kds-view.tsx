'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Clock, Play, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '@/lib/context'
import { BackButton } from '@/components/back-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])
  
  const kitchenKey = kitchen === 'a' ? 'cocina_a' : 'cocina_b'
  const kitchenName = kitchen === 'a' ? 'Cocina A' : 'Cocina B'
  const kitchenDesc = kitchen === 'a' ? 'Tacos y carnes' : 'Antojitos y complementos'
  
  const otherKitchenKey = kitchen === 'a' ? 'cocina_b' : 'cocina_a'
  
  const relevantOrders = orders.filter(order => {
    if (order.status === 'entregado' || order.status === 'cancelado') return false
    // Exclude orders claimed exclusively by the other kitchen
    if (order.claimedByKitchen && order.claimedByKitchen !== kitchenKey) return false
    const hasItems = order.items.some(
      item => item.menuItem.cocina === kitchenKey || item.menuItem.cocina === 'ambas'
    )
    return hasItems
  })
  
  // Funcion para ordenar por hora de llegada (mas antiguo primero = mayor prioridad)
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
    if (minutes >= 10) return 'text-warning'
    return 'text-muted-foreground'
  }

  const getActiveOrders = () => {
    switch (activeTab) {
      case 'queue': return queueOrders
      case 'preparing': return preparingOrders
      case 'ready': return readyOrders
    }
  }

  const tabs: { key: KDSTab; label: string; count: number; color: string }[] = [
    { key: 'queue', label: 'Cola', count: queueOrders.length, color: 'bg-muted-foreground' },
    { key: 'preparing', label: 'Preparando', count: preparingOrders.length, color: 'bg-primary' },
    { key: 'ready', label: 'Listo', count: readyOrders.length, color: 'bg-success' },
  ]
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Compact for mobile */}
      <header className="bg-foreground text-background px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BackButton onClick={onBack} label="Salir" variant="light" />
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
            <p className="text-[10px] text-background/70">
              {relevantOrders.length} pendiente{relevantOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="bg-background border-b border-border p-2 md:hidden">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-foreground'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${
                activeTab === tab.key ? 'bg-background' : tab.color
              }`} />
              <span>{tab.label}</span>
              <Badge 
                variant="secondary" 
                className={`text-[10px] h-4 px-1 ${
                  activeTab === tab.key 
                    ? 'bg-background/20 text-background' 
                    : 'bg-foreground/10'
                }`}
              >
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Content */}
      <main className="flex-1 p-2 md:hidden overflow-y-auto">
        <div className="space-y-2">
          {getActiveOrders().map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              items={getOrderItems(order)}
              status={activeTab === 'queue' ? 'en_cola' : activeTab === 'preparing' ? 'preparando' : 'listo'}
              timeColor={getTimeColor(order.createdAt)}
              onStart={activeTab === 'queue' ? () => handleStartOrder(order.id) : undefined}
              onComplete={activeTab === 'preparing' ? () => handleCompleteOrder(order.id) : undefined}
              priorityIndex={activeTab === 'queue' ? index : undefined}
            />
          ))}
          
          {getActiveOrders().length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center mb-3">
                {activeTab === 'queue' && <Clock className="h-5 w-5 text-muted-foreground" />}
                {activeTab === 'preparing' && <Play className="h-5 w-5 text-muted-foreground" />}
                {activeTab === 'ready' && <Check className="h-5 w-5 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'queue' && 'Sin ordenes en cola'}
                {activeTab === 'preparing' && 'Nada preparandose'}
                {activeTab === 'ready' && 'Sin ordenes listas'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Desktop 3-Column Layout */}
      <main className="flex-1 p-3 hidden md:block">
        <div className="grid grid-cols-3 gap-3 h-full">
          {/* Queue Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                En cola
              </h2>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {queueOrders.length}
              </Badge>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto">
              {queueOrders.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  items={getOrderItems(order)}
                  status="en_cola"
                  timeColor={getTimeColor(order.createdAt)}
                  onStart={() => handleStartOrder(order.id)}
                  priorityIndex={index}
                />
              ))}
              
              {queueOrders.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Sin ordenes
                </div>
              )}
            </div>
          </div>
          
          {/* Preparing Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Preparando
              </h2>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary text-primary">
                {preparingOrders.length}
              </Badge>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto">
              {preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  items={getOrderItems(order)}
                  status="preparando"
                  timeColor={getTimeColor(order.createdAt)}
                  onComplete={() => handleCompleteOrder(order.id)}
                />
              ))}
              
              {preparingOrders.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Nada preparandose
                </div>
              )}
            </div>
          </div>
          
          {/* Ready Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" />
                Listo
              </h2>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-success text-success">
                {readyOrders.length}
              </Badge>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto">
              {readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  items={getOrderItems(order)}
                  status="listo"
                  timeColor={getTimeColor(order.createdAt)}
                />
              ))}
              
              {readyOrders.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Sin ordenes listas
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  items: Order['items']
  status: KitchenStatus
  timeColor: string
  onStart?: () => void
  onComplete?: () => void
  priorityIndex?: number // Posicion en la cola de prioridad
}

function OrderCard({ order, items, status, timeColor, onStart, onComplete, priorityIndex }: OrderCardProps) {
  return (
    <Card className={`border transition-all ${
      status === 'preparando' ? 'border-primary bg-primary/5' :
      status === 'listo' ? 'border-success bg-success/5' :
      'border-border'
    }`}>
      <CardHeader className="p-2.5 pb-1.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              {/* Indicador de prioridad */}
              {priorityIndex !== undefined && status === 'en_cola' && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  priorityIndex === 0 ? 'bg-destructive text-destructive-foreground' :
                  priorityIndex < 3 ? 'bg-amber-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  #{priorityIndex + 1}
                </span>
              )}
              <CardTitle className="text-base font-bold">#{order.numero}</CardTitle>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                {getChannelLabel(order.canal)}
              </Badge>
              {order.mesa && (
                <span className="text-[9px] text-muted-foreground">
                  Mesa {order.mesa}
                </span>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-0.5 text-[10px] font-medium ${timeColor}`}>
            <Clock className="h-2.5 w-2.5" />
            {getTimeDiff(order.createdAt)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2.5 pt-0">
        {/* Items */}
        <ul className="space-y-1 mb-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-1">
              <span className="bg-foreground text-background text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0">
                {item.cantidad}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs text-foreground">{item.menuItem.nombre}</p>
                {item.notas && (
                  <p className="text-[9px] text-primary italic truncate">
                    {item.notas}
                  </p>
                )}
                {item.extras && item.extras.length > 0 && (
                  <p className="text-[9px] text-muted-foreground truncate">
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
            className="w-full h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onStart}
          >
            <Play className="h-3 w-3 mr-1" />
            INICIAR
          </Button>
        )}
        
        {status === 'preparando' && onComplete && (
          <Button
            className="w-full h-8 text-xs font-bold bg-success hover:bg-success/90 text-success-foreground"
            onClick={onComplete}
          >
            <Check className="h-3 w-3 mr-1" />
            LISTO
          </Button>
        )}
        
        {status === 'listo' && (
          <div className="bg-success/20 text-success text-center py-1.5 rounded text-[10px] font-medium">
            Esperando entrega
          </div>
        )}
      </CardContent>
    </Card>
  )
}
