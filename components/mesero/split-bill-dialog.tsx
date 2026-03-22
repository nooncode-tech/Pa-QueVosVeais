'use client'

import { useState, useMemo } from 'react'
import { X, Users, Printer, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/store'
import type { TableSession, OrderItem } from '@/lib/store'
import { useApp } from '@/lib/context'

interface SplitBillDialogProps {
  sessionId: string
  onClose: () => void
}

type Assignment = Record<string, number> // itemKey -> comensalIndex (1-based, 0 = sin asignar)

// Flatten all order items from session into a list with unique keys
function flattenItems(session: TableSession) {
  const result: Array<{ key: string; item: OrderItem; orderId: string; orderNum: number }> = []
  for (const order of session.orders) {
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i]
      // Expand by cantidad so each unit can be split individually
      for (let u = 0; u < item.cantidad; u++) {
        result.push({
          key: `${order.id}-${i}-${u}`,
          item,
          orderId: order.id,
          orderNum: order.numero,
        })
      }
    }
  }
  return result
}

function itemUnitPrice(item: OrderItem) {
  const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
  const modTotal = item.modificadores?.reduce(
    (m, mg) => m + mg.opciones.reduce((o, op) => o + op.precioExtra, 0), 0
  ) || 0
  return item.menuItem.precio + extrasTotal + modTotal
}

const COMENSAL_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500',
]

export function SplitBillDialog({ sessionId, onClose }: SplitBillDialogProps) {
  const { getSessionBill, config } = useApp()
  const session = getSessionBill(sessionId)
  const [numComensales, setNumComensales] = useState(2)
  const [assignments, setAssignments] = useState<Assignment>({})
  const [viewingComensal, setViewingComensal] = useState<number | null>(null)

  if (!session) return null

  const flatItems = useMemo(() => flattenItems(session), [session])

  const assign = (key: string, comensal: number) => {
    setAssignments(prev => ({ ...prev, [key]: prev[key] === comensal ? 0 : comensal }))
  }

  // Per-comensal subtotals
  const comensalTotals = useMemo(() => {
    const totals: number[] = Array(numComensales + 1).fill(0)
    for (const fi of flatItems) {
      const c = assignments[fi.key] ?? 0
      totals[c] += itemUnitPrice(fi.item)
    }
    return totals
  }, [flatItems, assignments, numComensales])

  const unassignedTotal = comensalTotals[0]
  const iva = config.impuestoPorcentaje / 100

  const printComensal = (c: number) => {
    const items = flatItems.filter(fi => (assignments[fi.key] ?? 0) === c)
    const subtotal = comensalTotals[c]
    const ivaAmount = subtotal * iva
    const total = subtotal + ivaAmount

    const win = window.open('', '_blank', 'width=400,height=500')
    if (!win) return

    const lines = items.map(fi =>
      `<tr><td>${fi.item.menuItem.nombre}</td><td style="text-align:right">$${itemUnitPrice(fi.item).toFixed(2)}</td></tr>`
    ).join('')

    win.document.write(`<!DOCTYPE html><html><head><title>Cuenta Comensal ${c}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:13px;padding:16px;max-width:300px}
      table{width:100%;border-collapse:collapse}td{padding:2px 0;vertical-align:top}.sep{border-top:1px dashed #999;margin:6px 0}
      .bold{font-weight:bold}.center{text-align:center}</style></head><body>
      <div class="center bold" style="font-size:15px;margin-bottom:4px">Pa Que Vos Veais</div>
      <div class="center" style="font-size:11px;margin-bottom:8px">Mesa ${session.mesa} — Persona ${c}</div>
      <div class="sep"></div>
      <table>${lines}</table>
      <div class="sep"></div>
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">$${subtotal.toFixed(2)}</td></tr>
        <tr><td>IVA (${config.impuestoPorcentaje}%)</td><td style="text-align:right">$${ivaAmount.toFixed(2)}</td></tr>
        <tr><td class="bold">Total</td><td style="text-align:right" class="bold">$${total.toFixed(2)}</td></tr>
      </table>
      <div class="sep"></div>
      <div class="center" style="font-size:11px;margin-top:8px">Gracias por su visita</div>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-background rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between rounded-t-2xl sm:rounded-t-xl">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Dividir cuenta — Mesa {session.mesa}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Number of diners */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-foreground">Comensales:</span>
            <div className="flex gap-1">
              {[2,3,4,5,6,7,8].map(n => (
                <button
                  key={n}
                  onClick={() => setNumComensales(n)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    numComensales === n
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-1">
            {flatItems.map((fi) => {
              const assigned = assignments[fi.key] ?? 0
              return (
                <div key={fi.key} className="flex items-center gap-2 py-1.5 border-b border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{fi.item.menuItem.nombre}</p>
                    <p className="text-[10px] text-muted-foreground">
                      #{fi.orderNum} · {formatPrice(itemUnitPrice(fi.item))}
                    </p>
                  </div>
                  {/* Comensal chips */}
                  <div className="flex gap-1 flex-shrink-0">
                    {Array.from({ length: numComensales }, (_, i) => i + 1).map(c => (
                      <button
                        key={c}
                        onClick={() => assign(fi.key, c)}
                        className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                          assigned === c
                            ? `${COMENSAL_COLORS[c-1]} text-white scale-110`
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary per comensal */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-foreground">Resumen por persona</h3>
            {Array.from({ length: numComensales }, (_, i) => i + 1).map(c => {
              const subtotal = comensalTotals[c]
              const ivaAmount = subtotal * iva
              const total = subtotal + ivaAmount
              const count = flatItems.filter(fi => (assignments[fi.key] ?? 0) === c).length
              return (
                <div key={c} className="bg-secondary/50 rounded-xl p-3">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setViewingComensal(viewingComensal === c ? null : c)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${COMENSAL_COLORS[c-1]} flex items-center justify-center text-[10px] font-bold text-white`}>
                        {c}
                      </div>
                      <span className="text-xs font-medium text-foreground">Persona {c}</span>
                      <span className="text-[10px] text-muted-foreground">({count} items)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{formatPrice(total)}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${viewingComensal === c ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {viewingComensal === c && (
                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                      {flatItems.filter(fi => (assignments[fi.key] ?? 0) === c).map(fi => (
                        <div key={fi.key} className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{fi.item.menuItem.nombre}</span>
                          <span>{formatPrice(itemUnitPrice(fi.item))}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                        <span>IVA ({config.impuestoPorcentaje}%)</span>
                        <span>{formatPrice(ivaAmount)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs mt-1 gap-1 bg-transparent"
                        onClick={() => printComensal(c)}
                        disabled={count === 0}
                      >
                        <Printer className="h-3 w-3" />
                        Imprimir cuenta persona {c}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}

            {unassignedTotal > 0 && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                ⚠ {formatPrice(unassignedTotal)} sin asignar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
