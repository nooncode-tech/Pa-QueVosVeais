'use client'

import { Users, Bell, Receipt, Clock, ChefHat } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getTimeDiff } from '@/lib/store'

interface TablesGridProps {
  onSelectTable: (mesa: number) => void
}

export function TablesGrid({ onSelectTable }: TablesGridProps) {
  const { tableSessions, getPendingCalls, getActiveTables } = useApp()
  
  const pendingCalls = getPendingCalls()
  
  const getTableStatus = (mesa: number) => {
    const session = tableSessions.find(s => s.mesa === mesa && s.activa)
    const tableOrders = session?.orders?.filter(
      o => o.status !== 'entregado' && o.status !== 'cancelado'
    ) || []
    const tableCalls = pendingCalls.filter(c => c.mesa === mesa)
    
    // Check for payment requested
    const paymentRequested = session?.paymentStatus === 'solicitado' ||
                            tableCalls.some(c => c.tipo === 'cuenta')
    
    // Check for attention calls
    const hasAttentionCall = tableCalls.some(c => c.tipo === 'atencion' || c.tipo === 'otro')
    
    if (!session && tableOrders.length === 0) {
      return { 
        status: 'libre' as const, 
        label: 'Libre', 
        bgColor: 'bg-secondary',
        textColor: 'text-muted-foreground',
        borderColor: 'border-transparent',
        hasCall: false,
        hasBillRequest: false,
        orderCount: 0,
        session: null
      }
    }

    // Session is paid - show special status
    if (session?.billStatus === 'pagada') {
      return { 
        status: 'pagada' as const, 
        label: tableOrders.length > 0 ? 'Pagada (entregas)' : 'Pagada',
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-500',
        hasCall: hasAttentionCall,
        hasBillRequest: false,
        orderCount: tableOrders.length,
        session
      }
    }
    
    const hasReady = tableOrders.some(o => o.status === 'listo')
    const hasPreparing = tableOrders.some(o => o.status === 'preparando')
    
    if (hasReady) {
      return { 
        status: 'listo' as const, 
        label: 'Listo para entregar', 
        bgColor: 'bg-success',
        textColor: 'text-success',
        borderColor: 'border-success',
        hasCall: hasAttentionCall,
        hasBillRequest: paymentRequested,
        orderCount: tableOrders.length,
        session
      }
    }
    if (hasPreparing) {
      return { 
        status: 'preparando' as const, 
        label: 'En cocina', 
        bgColor: 'bg-primary',
        textColor: 'text-primary',
        borderColor: 'border-primary',
        hasCall: hasAttentionCall,
        hasBillRequest: paymentRequested,
        orderCount: tableOrders.length,
        session
      }
    }
    
    return { 
      status: 'ocupada' as const, 
      label: 'Ocupada', 
      bgColor: 'bg-muted-foreground',
      textColor: 'text-muted-foreground',
      borderColor: 'border-muted-foreground/30',
      hasCall: hasAttentionCall,
      hasBillRequest: paymentRequested,
      orderCount: tableOrders.length,
      session
    }
  }
  
  const activeTables = getActiveTables()
  
  // Group tables by status for quick stats using unique table IDs
  const tableStatuses = activeTables.map(t => ({ tableId: t.id, mesa: t.numero, ...getTableStatus(t.numero) }))
  const freeCount = tableStatuses.filter(t => t.status === 'libre').length
  const readyCount = tableStatuses.filter(t => t.status === 'listo').length
  const preparingCount = tableStatuses.filter(t => t.status === 'preparando').length
  const occupiedCount = tableStatuses.filter(t => t.status === 'ocupada' || t.status === 'pagada').length
  
  return (
    <div className="p-3 md:p-4 lg:p-6 bg-card">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-secondary/50">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-2xl font-bold text-foreground">{freeCount}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">Libres</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-success/10">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
            <Receipt className="h-4 w-4 md:h-5 md:w-5 text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-2xl font-bold text-success">{readyCount}</p>
            <p className="text-[10px] md:text-xs text-success truncate">Listos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-primary/10">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <ChefHat className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-2xl font-bold text-primary">{preparingCount}</p>
            <p className="text-[10px] md:text-xs text-primary truncate">En cocina</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-muted/50">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-lg md:text-2xl font-bold text-foreground">{occupiedCount}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">Ocupadas</p>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3 md:mb-4 text-[10px] md:text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-secondary border border-border" />
          <span className="text-muted-foreground">Libre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          <span className="text-muted-foreground">Ocupada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">En cocina</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Listo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Pagada</span>
        </div>
      </div>
      
      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
        {tableStatuses.map(({ tableId, mesa, status, label, bgColor, textColor, borderColor, hasCall, hasBillRequest, orderCount, session }) => {
          const isHighPriority = hasCall || hasBillRequest || status === 'listo'
          
          return (
            <Card
              key={tableId}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg border-2 relative group",
                isHighPriority && "ring-2 ring-offset-2",
                hasCall && "ring-destructive",
                hasBillRequest && !hasCall && "ring-amber-500",
                status === 'listo' && !hasCall && !hasBillRequest && "ring-success",
                !isHighPriority && "hover:border-primary/30",
                borderColor
              )}
              onClick={() => onSelectTable(mesa)}
            >
              {/* Notification badges */}
              {(hasCall || hasBillRequest) && (
                <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                  {hasCall && (
                    <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-md animate-pulse">
                      <Bell className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {hasBillRequest && (
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      <Receipt className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              )}
              
              <CardContent className="p-4">
                {/* Table Icon */}
                <div className={cn(
                  "w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105",
                  bgColor,
                  status === 'libre' ? 'text-muted-foreground' : 'text-white'
                )}>
                  <Users className="h-6 w-6" />
                </div>
                
                {/* Table Number */}
                <h3 className="font-bold text-lg text-foreground text-center">
                  Mesa {mesa}
                </h3>
                
                {/* Status Label */}
                <p className={cn(
                  "text-xs text-center font-medium mt-1",
                  textColor
                )}>
                  {label}
                </p>
                
                {/* Order Count & Time */}
                {orderCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <span>{orderCount} pedido{orderCount !== 1 ? 's' : ''}</span>
                      {session?.createdAt && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {getTimeDiff(session.createdAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Quick Status Badges */}
                {status !== 'libre' && session && (
                  <div className="mt-2 flex justify-center">
                    {status === 'listo' && (
                      <Badge className="bg-success/20 text-success border-0 text-[10px]">
                        Entregar
                      </Badge>
                    )}
                    {status === 'pagada' && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                        Cerrar mesa
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
