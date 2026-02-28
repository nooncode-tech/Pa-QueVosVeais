'use client'

import { useState } from 'react'
import { Plus, Phone, MapPin, Clock, Package, Check, Truck, ShoppingBag, AlertCircle, X, Edit3, MoreVertical } from 'lucide-react'
import { useApp } from '@/lib/context'
import { CancelOrderDialog } from '@/components/shared/cancel-order-dialog'
import { EditOrderDialog } from '@/components/shared/edit-order-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  formatPrice, 
  formatTime, 
  getStatusLabel,
  getTimeDiff,
  type Channel,
  type OrderStatus
} from '@/lib/store'
import { CreateOrderDialog } from './create-order-dialog'

export function OrdersManager() {
  const { orders, updateOrderStatus } = useApp()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createChannel, setCreateChannel] = useState<Channel>('para_llevar')
  const [activeTab, setActiveTab] = useState<'takeout' | 'delivery'>('takeout')
  
  const deliveryOrders = orders.filter(o => o.canal === 'delivery')
  const takeoutOrders = orders.filter(o => o.canal === 'para_llevar')
  const activeDelivery = deliveryOrders.filter(o => o.status !== 'entregado')
  const activeTakeout = takeoutOrders.filter(o => o.status !== 'entregado')
  
  const handleCreateOrder = (channel: Channel) => {
    setCreateChannel(channel)
    setShowCreateDialog(true)
  }

  const currentOrders = activeTab === 'takeout' ? takeoutOrders : deliveryOrders
  const activeCount = activeTab === 'takeout' ? activeTakeout.length : activeDelivery.length
  
  return (
    <div className="p-3">
      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab('takeout')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'takeout'
              ? 'bg-foreground text-background'
              : 'bg-secondary text-foreground'
          }`}
        >
          <ShoppingBag className="h-3 w-3" />
          Para llevar
          {activeTakeout.length > 0 && (
            <Badge 
              variant="secondary" 
              className={`text-[9px] h-3.5 px-1 ${
                activeTab === 'takeout' ? 'bg-background/20 text-background' : 'bg-primary/20 text-primary'
              }`}
            >
              {activeTakeout.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'delivery'
              ? 'bg-foreground text-background'
              : 'bg-secondary text-foreground'
          }`}
        >
          <Truck className="h-3 w-3" />
          Delivery
          {activeDelivery.length > 0 && (
            <Badge 
              variant="secondary" 
              className={`text-[9px] h-3.5 px-1 ${
                activeTab === 'delivery' ? 'bg-background/20 text-background' : 'bg-primary/20 text-primary'
              }`}
            >
              {activeDelivery.length}
            </Badge>
          )}
        </button>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-foreground">
            {activeTab === 'takeout' ? 'Pedidos para llevar' : 'Pedidos delivery'}
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {activeCount} pedido{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          className="bg-primary text-primary-foreground h-7 text-[10px] px-2.5"
          onClick={() => handleCreateOrder(activeTab === 'takeout' ? 'para_llevar' : 'delivery')}
        >
          <Plus className="h-3 w-3 mr-1" />
          Nuevo
        </Button>
      </div>
      
      <OrdersList 
        orders={currentOrders} 
        channel={activeTab === 'takeout' ? 'para_llevar' : 'delivery'}
        onUpdateStatus={updateOrderStatus}
      />
      
      {showCreateDialog && (
        <CreateOrderDialog
          channel={createChannel}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  )
}

interface OrdersListProps {
  orders: ReturnType<typeof useApp>['orders']
  channel: Channel
  onUpdateStatus: (orderId: string, status: OrderStatus) => void
}

function OrdersList({ orders, channel, onUpdateStatus }: OrdersListProps) {
  const activeOrders = orders.filter(o => o.status !== 'entregado')
  const completedOrders = orders.filter(o => o.status === 'entregado')
  
  if (orders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Package className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Sin pedidos</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-3">
      {activeOrders.length > 0 && (
        <div>
          <h3 className="font-medium text-[10px] text-foreground mb-1.5">Activos</h3>
          <div className="grid gap-1.5">
            {activeOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                channel={channel}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </div>
        </div>
      )}
      
      {completedOrders.length > 0 && (
        <div>
          <h3 className="font-medium text-[10px] text-muted-foreground mb-1.5">Completados</h3>
          <div className="grid gap-1.5">
            {completedOrders.slice(0, 4).map((order) => (
              <OrderCard 
                key={order.id} 
                order={order}
                channel={channel}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface OrderCardProps {
  order: ReturnType<typeof useApp>['orders'][0]
  channel: Channel
  onUpdateStatus: (orderId: string, status: OrderStatus) => void
}

function OrderCard({ order, channel, onUpdateStatus }: OrderCardProps) {
  const { canEditOrder, canCancelOrder } = useApp()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  const canEdit = canEditOrder(order.id)
  const canCancel = canCancelOrder(order.id)
  const total = order.items.reduce((sum, item) => {
    const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
    return sum + (item.menuItem.precio + extrasTotal) * item.cantidad
  }, 0)
  
  // Check kitchen status
  const needsA = order.items.some(i => i.menuItem.cocina === 'cocina_a' || i.menuItem.cocina === 'ambas')
  const needsB = order.items.some(i => i.menuItem.cocina === 'cocina_b' || i.menuItem.cocina === 'ambas')
  const aReady = !needsA || order.cocinaAStatus === 'listo'
  const bReady = !needsB || order.cocinaBStatus === 'listo'
  const allKitchensReady = aReady && bReady
  
  const getNextAction = () => {
    if (order.status === 'entregado') return null
    
    if (order.status === 'listo') {
      if (channel === 'delivery') {
        return { label: 'En camino', status: 'en_camino' as OrderStatus }
      }
      return { label: 'Entregado', status: 'entregado' as OrderStatus }
    }
    
    if (order.status === 'en_camino') {
      return { label: 'Entregado', status: 'entregado' as OrderStatus }
    }
    
    return null
  }
  
  const nextAction = getNextAction()
  
  return (
    <div>
      <Card className={`border transition-all ${
        order.status === 'entregado' ? 'opacity-50' : ''
      } ${order.status === 'listo' ? 'border-success bg-success/5' : ''} ${
        order.status === 'en_camino' ? 'border-blue-500 bg-blue-50' : ''
      }`}>
        <CardContent className="p-2">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xs">#{order.numero}</CardTitle>
              <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2 w-2" />
                {formatTime(order.createdAt)} ({getTimeDiff(order.createdAt)})
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              {(canEdit || canCancel) && order.status !== 'entregado' && order.status !== 'cancelado' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Edit3 className="h-3 w-3 mr-2" />
                        Editar pedido
                      </DropdownMenuItem>
                    )}
                    {canCancel && (
                      <>
                        {canEdit && <DropdownMenuSeparator />}
                        <DropdownMenuItem 
                          onClick={() => setShowCancelDialog(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="h-3 w-3 mr-2" />
                          Cancelar pedido
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Badge className={`text-[9px] h-4 px-1.5 ${
                order.status === 'listo' ? 'bg-success text-success-foreground' :
                order.status === 'preparando' ? 'bg-primary/20 text-primary' :
                order.status === 'entregado' ? 'bg-muted text-muted-foreground' :
                order.status === 'en_camino' ? 'bg-blue-500 text-white' :
                'bg-secondary text-secondary-foreground'
              }`}>
                {order.status === 'en_camino' ? 'En camino' : getStatusLabel(order.status)}
              </Badge>
            </div>
          </div>
          
          {/* Customer Info */}
          {order.nombreCliente && (
            <div className="mb-1.5 p-1.5 bg-secondary rounded text-[10px]">
              <p className="font-medium text-foreground">{order.nombreCliente}</p>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                {order.telefono && (
                  <p className="text-muted-foreground flex items-center gap-0.5">
                    <Phone className="h-2 w-2" />
                    {order.telefono}
                  </p>
                )}
                {order.direccion && (
                  <p className="text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="h-2 w-2" />
                    <span className="truncate max-w-[120px]">{order.direccion}</span>
                  </p>
                )}
                {order.zonaReparto && (
                  <Badge variant="outline" className="text-[8px] h-3.5">
                    {order.zonaReparto}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Items */}
          <ul className="space-y-0.5 mb-1.5">
            {order.items.slice(0, 3).map((item) => (
              <li key={item.id} className="text-[10px] flex justify-between text-foreground">
                <span className="truncate">{item.cantidad}x {item.menuItem.nombre}</span>
              </li>
            ))}
            {order.items.length > 3 && (
              <li className="text-[9px] text-muted-foreground">
                +{order.items.length - 3} mas...
              </li>
            )}
          </ul>
          
          {/* Kitchen Status */}
          {order.status !== 'entregado' && order.status !== 'en_camino' && (
            <div className="flex gap-1 text-[9px] mb-2">
              {needsA && (
                <span className={`px-1.5 py-0.5 rounded ${
                  order.cocinaAStatus === 'listo' ? 'bg-success/20 text-success' :
                  order.cocinaAStatus === 'preparando' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  A: {order.cocinaAStatus === 'listo' ? 'Listo' : 
                      order.cocinaAStatus === 'preparando' ? 'Prep.' : 'Cola'}
                </span>
              )}
              {needsB && (
                <span className={`px-1.5 py-0.5 rounded ${
                  order.cocinaBStatus === 'listo' ? 'bg-success/20 text-success' :
                  order.cocinaBStatus === 'preparando' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  B: {order.cocinaBStatus === 'listo' ? 'Listo' : 
                      order.cocinaBStatus === 'preparando' ? 'Prep.' : 'Cola'}
                </span>
              )}
              {!allKitchensReady && (
                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                  <AlertCircle className="h-2.5 w-2.5" />
                  Esperando cocina
                </span>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center pt-1.5 border-t border-border">
            <div>
              <span className="text-[9px] text-muted-foreground">Total</span>
              <span className="font-semibold text-xs text-foreground ml-1">{formatPrice(total)}</span>
            </div>
            
            {nextAction && allKitchensReady && (
              <Button
                size="sm"
                className={`h-6 text-[10px] px-2 ${
                  nextAction.status === 'entregado' ? 'bg-success hover:bg-success/90 text-success-foreground' :
                  nextAction.status === 'en_camino' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                  'bg-primary'
                }`}
                onClick={() => onUpdateStatus(order.id, nextAction.status)}
              >
                {nextAction.status === 'en_camino' && <Truck className="h-2.5 w-2.5 mr-1" />}
                {nextAction.status === 'entregado' && <Check className="h-2.5 w-2.5 mr-1" />}
                {nextAction.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <CancelOrderDialog
        order={order}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />
      
      <EditOrderDialog
        order={order}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </div>
  )
}
