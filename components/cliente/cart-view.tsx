'use client'

import { ChevronLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/store'

interface CartViewProps {
  mesa: number
  onBack: () => void
  onOrderConfirmed: () => void
}

export function CartView({ mesa, onBack, onOrderConfirmed }: CartViewProps) {
  const { cart, updateCartItem, removeFromCart, createOrder, config } = useApp()

  const subtotal = cart.reduce((sum, item) => {
    const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
    return sum + (item.menuItem.precio + extrasTotal) * item.cantidad
  }, 0)
  const iva = subtotal * (config.impuestoPorcentaje / 100)
  const total = subtotal + iva

  const handleConfirm = () => {
    createOrder('mesa', mesa)
    onOrderConfirmed()
  }
  
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
        {/* Header */}
        <header className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground">Tu pedido</span>
            <div className="w-8" />
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Tu carrito esta vacio</h2>
            <p className="text-sm text-muted-foreground mt-1">Agrega platillos del menu</p>
            <Button 
              className="mt-5 bg-foreground text-background h-10 px-6 text-sm rounded-xl" 
              onClick={onBack}
            >
              Ver menu
            </Button>
          </div>
        </main>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold text-foreground">Tu pedido</span>
            <p className="text-[11px] text-muted-foreground">Mesa {mesa}</p>
          </div>
          <div className="w-8" />
        </div>
      </header>

      {/* Cart Items */}
      <main className="flex-1 px-4 py-4 pb-48">
        <div className="space-y-3">
          {cart.map((item) => {
            const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
            const itemTotal = (item.menuItem.precio + extrasTotal) * item.cantidad
            
            return (
              <div key={item.id} className="flex gap-3 py-2">
                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
  <img
    src={item.menuItem.imagen || "/placeholder.svg"}
    alt={item.menuItem.nombre}
    className="w-full h-full object-cover"
  />
</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-[13px] text-foreground leading-tight">
                        {item.menuItem.nombre}
                      </h3>
                      
                      {/* Extras */}
                      {item.extras && item.extras.length > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          + {item.extras.map(e => e.nombre).join(', ')}
                        </p>
                      )}

                      {/* Modifiers */}
                      {item.modificadores && item.modificadores.length > 0 && (
                        <div className="mt-0.5">
                          {item.modificadores.map(mg => (
                            <p key={mg.grupoId} className="text-[11px] text-primary">
                              {mg.grupoNombre}: {mg.opciones.map(o => o.nombre).join(', ')}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {item.notas && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                          &quot;{item.notas}&quot;
                        </p>
                      )}
                    </div>
                    
                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        className="w-7 h-7 flex items-center justify-center border border-border rounded-lg"
                        onClick={() => {
                          if (item.cantidad > 1) {
                            updateCartItem(item.id, item.cantidad - 1)
                          } else {
                            removeFromCart(item.id)
                          }
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-[13px] font-semibold text-foreground w-5 text-center">
                        {item.cantidad}
                      </span>
                      <button
                        className="w-7 h-7 flex items-center justify-center border border-border rounded-lg"
                        onClick={() => updateCartItem(item.id, item.cantidad + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <p className="font-semibold text-[13px] text-foreground">
                      {formatPrice(itemTotal)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 space-y-3 max-w-md mx-auto">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>IVA ({config.impuestoPorcentaje}%)</span>
            <span>{formatPrice(iva)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-foreground pt-1.5 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <Button
          className="w-full bg-foreground hover:bg-foreground/90 text-background h-12 text-sm font-semibold rounded-xl"
          onClick={handleConfirm}
        >
          Confirmar pedido · {formatPrice(total)}
        </Button>
      </div>
    </div>
  )
}
