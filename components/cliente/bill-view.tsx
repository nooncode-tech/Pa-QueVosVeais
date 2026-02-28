'use client'

import { useState } from 'react'
import { ChevronLeft, Gift, Bell, Check } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/store'

interface BillViewProps {
  sessionId: string
  mesa: number
  onBack: () => void
  onShowRewards: () => void
}

export function BillView({ sessionId, mesa, onBack, onShowRewards }: BillViewProps) {
  const {
    tableSessions,
    config,
    setTipAmount,
    createWaiterCall,
    waiterCalls,
  } = useApp()

  const session = tableSessions.find(s => s.id === sessionId)

  // Check if there is already a pending "cuenta" call for this table
  const hasPendingBillCall = waiterCalls.some(
    c => c.mesa === mesa && c.tipo === 'cuenta' && !c.atendido
  )
  const [billRequested, setBillRequested] = useState(hasPendingBillCall)

  if (!session) {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
        <header className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground">Mi Cuenta</span>
            <div className="w-8" />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">No hay cuenta activa</p>
        </main>
      </div>
    )
  }

  const suggestedTips = [0, 10, 15, 20]
  const currentTipPercent = session.subtotal > 0
    ? Math.round((session.propina / session.subtotal) * 100)
    : 0

  const handleTipSelect = (percent: number) => {
    const tipAmount = session.subtotal * (percent / 100)
    setTipAmount(sessionId, tipAmount)
  }

  const handleRequestBill = () => {
    createWaiterCall(mesa, 'cuenta', 'El cliente solicita la cuenta')
    setBillRequested(true)
  }

  const isPaid = session.paymentStatus === 'pagado'
  const isPending = session.paymentStatus === 'pendiente' && !billRequested && !hasPendingBillCall
  const isWaiting = billRequested || hasPendingBillCall

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold text-foreground">Mi Cuenta</span>
            <p className="text-[11px] text-muted-foreground">Mesa {mesa}</p>
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-48">
        {/* Order Summary */}
        {session.orders.length > 0 ? (
          <div className="space-y-4">
            {session.orders.map((order) => (
              <div key={order.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Pedido #{order.numero}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    order.status === 'entregado'
                      ? 'bg-emerald-100 text-emerald-700'
                      : order.status === 'listo'
                      ? 'bg-amber-100 text-amber-700'
                      : order.status === 'cancelado'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {order.status === 'entregado' ? 'Entregado' :
                     order.status === 'listo' ? 'Listo' :
                     order.status === 'cancelado' ? 'Cancelado' : 'En proceso'}
                  </span>
                </div>

                {order.items.map((item) => {
                  const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
                  const itemTotal = (item.menuItem.precio + extrasTotal) * item.cantidad

                  return (
                    <div key={item.id} className="flex justify-between py-1">
                      <div className="flex-1">
                        <span className="text-[13px] text-foreground">
                          {item.cantidad}x {item.menuItem.nombre}
                        </span>
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            + {item.extras.map(e => e.nombre).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="text-[13px] text-foreground font-medium">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No hay consumos aun</p>
          </div>
        )}

        {/* Rewards Button */}
        {isPending && session.orders.length > 0 && (
          <button
            onClick={onShowRewards}
            className="w-full mt-4 flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-medium text-foreground">Obtener descuento</span>
            </div>
            <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />
          </button>
        )}

        {/* Tip Selection */}
        {session.orders.length > 0 && !isPaid && (
          <div className="mt-6">
            <p className="text-xs font-medium text-foreground mb-2">Propina (opcional)</p>
            <div className="flex gap-2">
              {suggestedTips.map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleTipSelect(percent)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTipPercent === percent
                      ? 'bg-foreground text-background'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {percent === 0 ? 'Sin' : `${percent}%`}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Summary */}
      {session.orders.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border p-4 max-w-md mx-auto">
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[13px] text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(session.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-muted-foreground">
              <span>IVA ({config.impuestoPorcentaje}%)</span>
              <span>{formatPrice(session.impuestos)}</span>
            </div>
            {session.propina > 0 && (
              <div className="flex justify-between text-[13px] text-muted-foreground">
                <span>Propina</span>
                <span>{formatPrice(session.propina)}</span>
              </div>
            )}
            {session.descuento > 0 && (
              <div className="flex justify-between text-[13px] text-emerald-600">
                <span>Descuento {session.descuentoMotivo && `(${session.descuentoMotivo})`}</span>
                <span>-{formatPrice(session.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-foreground pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatPrice(session.total)}</span>
            </div>
          </div>

          {isPaid ? (
            <div className="text-center py-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Check className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700">Cuenta pagada</p>
              </div>
              <p className="text-[11px] text-emerald-600">Gracias por tu visita</p>
            </div>
          ) : isWaiting ? (
            <div className="text-center py-3 bg-amber-50 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Bell className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-700">Cuenta solicitada</p>
              </div>
              <p className="text-[11px] text-amber-600">El mesero vendra a cobrarte pronto</p>
            </div>
          ) : (
            <Button
              className="w-full bg-foreground hover:bg-foreground/90 text-background h-11 text-sm font-semibold rounded-xl gap-2"
              onClick={handleRequestBill}
            >
              <Bell className="h-4 w-4" />
              Pedir la cuenta
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
