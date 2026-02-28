'use client'

import { Users, Bell, Receipt } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TablesGridProps {
  onSelectTable: (mesa: number) => void
}

export function TablesGrid({ onSelectTable }: TablesGridProps) {
  const { orders, tableSessions, getPendingCalls, getActiveTables } = useApp()
  
  const pendingCalls = getPendingCalls()
  
  const getTableStatus = (mesa: number) => {
    const session = tableSessions.find(
  s => s.mesa === mesa && s.activa
)

const tableOrders = session?.orders?.filter(
  o => o.status !== 'entregado' && o.status !== 'cancelado'
) || []

    const tableCalls = pendingCalls.filter(c => c.mesa === mesa)
    
    // Check for payment requested
    const paymentRequested = session?.paymentStatus === 'solicitado' || 
                            session?.billStatus === 'solicitada' ||
                            tableCalls.some(c => c.tipo === 'cuenta')
    
    // Check for attention calls
    const hasAttentionCall = tableCalls.some(c => c.tipo === 'atencion' || c.tipo === 'otro')
    
    if (!session && tableOrders.length === 0) {
      return { 
        status: 'libre', 
        label: 'Libre', 
        color: 'bg-secondary',
        hasCall: false,
        hasBillRequest: false
      }
    }

    // Session is paid - show special status
    if (session?.billStatus === 'pagada') {
      if (tableOrders.length === 0) {
        return { 
          status: 'pagada', 
          label: 'Pagada', 
          color: 'bg-emerald-500',
          hasCall: hasAttentionCall,
          hasBillRequest: false
        }
      }
      return { 
        status: 'pagada', 
        label: 'Pagada (entregas)',
        color: 'bg-emerald-500',
        hasCall: hasAttentionCall,
        hasBillRequest: false
      }
    }
    
    const hasReady = tableOrders.some(o => o.status === 'listo')
    const hasPreparing = tableOrders.some(o => o.status === 'preparando')
    
    if (hasReady) {
      return { 
        status: 'listo', 
        label: 'Listo', 
        color: 'bg-success',
        hasCall: hasAttentionCall,
        hasBillRequest: paymentRequested
      }
    }
    if (hasPreparing) {
      return { 
        status: 'preparando', 
        label: 'Preparando', 
        color: 'bg-primary',
        hasCall: hasAttentionCall,
        hasBillRequest: paymentRequested
      }
    }
    
    return { 
      status: 'ocupada', 
      label: 'Ocupada', 
      color: 'bg-muted-foreground',
      hasCall: hasAttentionCall,
      hasBillRequest: paymentRequested
    }
  }
  
  const activeTables = getActiveTables()
  const tables = activeTables.map(t => t.numero)
  
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-foreground">Vista de mesas</h2>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-secondary border border-border" />
            <span className="text-muted-foreground">Libre</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">Ocupada</span>
          </div>
          <div className="flex items-center gap-1 hidden sm:flex">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Preparando</span>
          </div>
          <div className="flex items-center gap-1 hidden sm:flex">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Listo</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {tables.map((mesa) => {
          const { status, label, color, hasCall, hasBillRequest } = getTableStatus(mesa)
          const session = tableSessions.find(
  s => s.mesa === mesa && s.activa
)

const tableOrders = session?.orders.filter(
  o => o.status !== 'entregado' && o.status !== 'cancelado'
) || []

          
          return (
            <Card
              key={mesa}
              className={`cursor-pointer transition-all hover:shadow-md border relative ${
                hasCall || hasBillRequest ? 'ring-2 ring-amber-500 animate-pulse' :
                status === 'listo' ? 'border-success' : 
                status === 'preparando' ? 'border-primary' :
                'border-transparent hover:border-primary/30'
              }`}
              onClick={() => onSelectTable(mesa)}
            >
              {/* Notification badges */}
              {(hasCall || hasBillRequest) && (
                <div className="absolute -top-1.5 -right-1.5 flex gap-0.5">
                  {hasCall && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Bell className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  {hasBillRequest && (
                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                      <Receipt className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
              )}
              
              <CardContent className="p-2 text-center">
                <div className={`w-8 h-8 mx-auto rounded-md ${color} flex items-center justify-center mb-1 ${
                  status === 'libre' ? 'text-muted-foreground' : 'text-primary-foreground'
                }`}>
                  <Users className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-semibold text-[11px] text-foreground">Mesa {mesa}</h3>
                <p className={`text-[9px] leading-tight ${
                  status === 'listo' ? 'text-success font-medium' :
                  status === 'preparando' ? 'text-primary font-medium' :
                  'text-muted-foreground'
                }`}>
                  {label}
                </p>
                {tableOrders.length > 0 && (
                  <p className="text-[9px] text-muted-foreground">
                    {tableOrders.length} pedido{tableOrders.length > 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
