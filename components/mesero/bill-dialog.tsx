'use client'

import React from "react"

import { useState } from 'react'
import { X, Receipt, CreditCard, Banknote, Percent, Check, Printer, Smartphone, Users } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice, type PaymentMethod } from '@/lib/store'
import { SplitBillDialog } from './split-bill-dialog'
import { StripePaymentForm } from './stripe-payment-form'

interface BillDialogProps {
  sessionId: string
  onClose: () => void
}

export function BillDialog({ sessionId, onClose }: BillDialogProps) {
  const {
  getSessionBill,
  applyDiscount,
  setTipAmount,
  requestPayment,
  confirmPayment,
  config,
  logAction,
} = useApp()

  
  const session = getSessionBill(sessionId)
  
  const [descuento, setDescuento] = useState(session?.descuento?.toString() || '0')
  const [motivoDescuento, setMotivoDescuento] = useState('')
const quickDiscounts = [
  { label: "Seguirnos", percent: 10 },
  { label: "Cliente frecuente", percent: 5 },
]
  const [propina, setPropina] = useState(session?.propina?.toString() || '0')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [paying, setPaying] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [cashGiven, setCashGiven] = useState('')
  // Pago mixto
  const [isMixto, setIsMixto] = useState(false)
  const [mixtoMethod2, setMixtoMethod2] = useState<PaymentMethod | null>(null)
  const [mixtoAmount1, setMixtoAmount1] = useState('')
  const [mixtoAmount2, setMixtoAmount2] = useState('')
  
  if (!session) {
    return null
  }
  const isAlreadyPaid =
  session.billStatus === 'pagada' ||
  session.billStatus === 'cerrada'

  const maxDiscount = session.subtotal + session.impuestos

  const handleApplyDiscount = () => {
    const amount = Number.parseFloat(descuento) || 0
    if (amount <= 0 || !motivoDescuento.trim()) return
    if (amount > maxDiscount) {
      setDescuento(maxDiscount.toString())
      applyDiscount(sessionId, maxDiscount, motivoDescuento)
      return
    }
    applyDiscount(sessionId, amount, motivoDescuento)
  }
  
  const handleSetTip = (amount: number) => {
    setPropina(amount.toString())
    setTipAmount(sessionId, amount)
  }
  
  const handleConfirmPayment = () => {
    if (!selectedMethod || paying) return
    if (session.paymentStatus === 'pagado') return
    setPaying(true)
    if (isMixto && mixtoMethod2) {
      const a1 = Number(mixtoAmount1) || 0
      const a2 = Number(mixtoAmount2) || 0
      logAction('pago_mixto', `Pago mixto: ${selectedMethod} $${a1.toFixed(2)} + ${mixtoMethod2} $${a2.toFixed(2)} | Total $${calculatedTotal.toFixed(2)} | Mesa ${session.mesa}`, 'session', sessionId)
    }
    requestPayment(sessionId, selectedMethod)
    confirmPayment(sessionId)
    onClose()
  }

  const handleToggleMixto = () => {
    setIsMixto(v => {
      if (!v) {
        // pre-fill amounts
        const half = Math.round(calculatedTotal / 2 * 100) / 100
        setMixtoAmount1(half.toString())
        setMixtoAmount2((calculatedTotal - half).toString())
      }
      return !v
    })
  }




  
  const suggestedTips = [
    { label: '10%', value: Math.round(session.subtotal * 0.1) },
    { label: '15%', value: Math.round(session.subtotal * 0.15) },
    { label: '20%', value: Math.round(session.subtotal * 0.2) },
  ]
  
  const ALL_PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { key: 'efectivo', label: 'Efectivo', icon: <Banknote className="h-5 w-5" /> },
    { key: 'tarjeta', label: 'Tarjeta', icon: <CreditCard className="h-5 w-5" /> },
    { key: 'transferencia', label: 'Transferencia', icon: <Smartphone className="h-5 w-5" /> },
    { key: 'apple_pay', label: 'Apple Pay', icon: <Smartphone className="h-5 w-5" /> },
  ]
  const metodos = config.metodospagoActivos
  const paymentMethods = ALL_PAYMENT_METHODS.filter(m => metodos[m.key as keyof typeof metodos] ?? false)
  
  // Recalculate total with current values
  const currentDiscount = Number.parseFloat(descuento) || 0
  const currentTip = Number.parseFloat(propina) || 0
  const calculatedTotal = session.subtotal + session.impuestos + currentTip - currentDiscount
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Cuenta Mesa {session.mesa}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Order Summary */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Detalle de consumo</h3>
            <Card>
              <CardContent className="p-3 space-y-2">
                {session.orders && session.orders.length > 0 ? (
                  session.orders.map((order) => (
                    <div key={order.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Pedido #{order.numero}
                      </div>
                      {order.items.map((item) => {
                        const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
                        const itemTotal = (item.menuItem.precio + extrasTotal) * item.cantidad
                        return (
                          <div key={item.id} className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-foreground font-medium">
                                {item.cantidad}x {item.menuItem.nombre}
                              </span>
                              <span className="text-muted-foreground">{formatPrice(itemTotal)}</span>
                            </div>
                            {/* Extras en el resumen de cobro */}
                            {item.extras && item.extras.length > 0 && (
                              <div className="ml-3 mt-0.5">
                                {item.extras.map((extra) => (
                                  <p key={extra.id} className="text-xs text-primary">
                                    + {extra.nombre} (+{formatPrice(extra.precio)})
                                  </p>
                                ))}
                              </div>
                            )}
                            {/* Notas/modificadores en el resumen de cobro */}
                            {item.notas && (
                              <p className="ml-3 mt-0.5 text-xs text-amber-600 italic">
                                Nota: {item.notas}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No hay items en esta cuenta</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Discount */}
          <div>
  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
    <Percent className="h-4 w-4" />
    Descuento
  </h3>

  {/* Botones de descuento estilo propina */}
  <div className="flex gap-2 mb-2">
    {quickDiscounts.map((d) => {
      const value = Math.round(session.subtotal * (d.percent / 100))

      return (
        <Button
          key={d.label}
          variant={Number.parseFloat(descuento) === value ? 'default' : 'outline'}
          size="sm"
          className="flex-1 h-9 text-xs"
          onClick={() => {
            setDescuento(value.toString())
            setMotivoDescuento(d.label)
          }}
        >
          {d.label} ({d.percent}%)
        </Button>
      )
    })}
  </div>

  {/* Descuento manual */}
  <div className="grid grid-cols-3 gap-2">
    <div>
      <Label className="text-xs text-muted-foreground">Monto (máx. {formatPrice(maxDiscount)})</Label>
      <Input
        type="number"
        min="0"
        max={maxDiscount}
        value={descuento}
        onChange={(e) => setDescuento(e.target.value)}
        placeholder="0"
        className="h-9 text-sm"
      />
    </div>

    <div className="col-span-2 flex gap-1 items-end">
      <Input
        value={motivoDescuento}
        onChange={(e) => setMotivoDescuento(e.target.value)}
        placeholder="Motivo del descuento"
        className="h-9 text-sm"
      />

      <Button
        size="sm"
        variant="outline"
        className="h-9 shrink-0"
        onClick={handleApplyDiscount}
        disabled={!motivoDescuento.trim() || Number.parseFloat(descuento) <= 0}
      >
        Aplicar
      </Button>
    </div>
  </div>
</div>
          
          {/* Tip */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Propina</h3>
            <div className="flex gap-2 mb-2">
              {suggestedTips.map((tip) => (
                <Button
                  key={tip.label}
                  variant={Number.parseFloat(propina) === tip.value ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-9 text-xs"
                  onClick={() => handleSetTip(tip.value)}
                >
                  {tip.label} ({formatPrice(tip.value)})
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Otro:</Label>
              <Input
                type="number"
                value={propina}
                onChange={(e) => {
                  setPropina(e.target.value)
                  setTipAmount(sessionId, Number.parseFloat(e.target.value) || 0)
                }}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
          </div>
          
          {/* Totals */}
          <Card className="bg-secondary/50">
            <CardContent className="p-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(session.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA ({config.impuestoPorcentaje}%)</span>
                  <span>{formatPrice(session.impuestos)}</span>
                </div>
                {currentDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Descuento</span>
                    <span>-{formatPrice(currentDiscount)}</span>
                  </div>
                )}
                {currentTip > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Propina</span>
                    <span>{formatPrice(currentTip)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatPrice(calculatedTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Method */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Método de pago</h3>
              <button
                type="button"
                onClick={handleToggleMixto}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${isMixto ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
              >
                Pago mixto
              </button>
            </div>
            {!isMixto ? (
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.key}
                    onClick={() => setSelectedMethod(method.key)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedMethod === method.key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-center mb-1">{method.icon}</div>
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3 bg-secondary/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Divide el total entre dos métodos</p>
                <div className="space-y-2">
                  {/* Method 1 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">1.</span>
                    <div className="flex gap-1.5 flex-1 flex-wrap">
                      {paymentMethods.map(m => (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setSelectedMethod(m.key)}
                          className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-xs border text-center transition-colors ${selectedMethod === m.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max={calculatedTotal}
                      value={mixtoAmount1}
                      onChange={e => {
                        setMixtoAmount1(e.target.value)
                        const v1 = Number(e.target.value) || 0
                        setMixtoAmount2(Math.max(0, calculatedTotal - v1).toFixed(2))
                      }}
                      className="w-24 h-8 text-sm"
                    />
                  </div>
                  {/* Method 2 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">2.</span>
                    <div className="flex gap-1.5 flex-1 flex-wrap">
                      {paymentMethods.filter(m => m.key !== selectedMethod).map(m => (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setMixtoMethod2(m.key)}
                          className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-xs border text-center transition-colors ${mixtoMethod2 === m.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max={calculatedTotal}
                      value={mixtoAmount2}
                      onChange={e => {
                        setMixtoAmount2(e.target.value)
                        const v2 = Number(e.target.value) || 0
                        setMixtoAmount1(Math.max(0, calculatedTotal - v2).toFixed(2))
                      }}
                      className="w-24 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground">Suma:</span>
                  <span className={Math.abs((Number(mixtoAmount1)||0) + (Number(mixtoAmount2)||0) - calculatedTotal) < 0.01 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                    {formatPrice((Number(mixtoAmount1)||0) + (Number(mixtoAmount2)||0))} / {formatPrice(calculatedTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Cobro en efectivo - calculadora de cambio */}
          {selectedMethod === 'efectivo' && (
            <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
              <h3 className="text-xs font-semibold text-foreground">Calculadora de cambio</h3>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Cliente paga:</Label>
                <Input
                  type="number"
                  min={calculatedTotal}
                  step="0.50"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder={formatPrice(calculatedTotal)}
                  className="h-8 text-sm"
                />
              </div>
              {/* Quick amounts */}
              <div className="flex gap-1.5 flex-wrap">
                {[50, 100, 200, 500].map(bill => (
                  bill >= calculatedTotal && (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setCashGiven(bill.toString())}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                        Number(cashGiven) === bill ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      ${bill}
                    </button>
                  )
                ))}
                <button
                  type="button"
                  onClick={() => setCashGiven(Math.ceil(calculatedTotal / 10) * 10 + '')}
                  className="px-2.5 py-1 rounded-lg text-xs border border-border hover:border-primary/50 transition-colors"
                >
                  Exacto
                </button>
              </div>
              {cashGiven && Number(cashGiven) >= calculatedTotal && (
                <div className="flex justify-between items-center pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground">Cambio a dar:</span>
                  <span className="text-base font-bold text-success">
                    {formatPrice(Number(cashGiven) - calculatedTotal)}
                  </span>
                </div>
              )}
              {cashGiven && Number(cashGiven) < calculatedTotal && (
                <p className="text-xs text-destructive">
                  Faltan {formatPrice(calculatedTotal - Number(cashGiven))}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 flex-wrap">
            <Button
              variant="outline"
              className="flex-1 h-10 text-xs gap-1.5 bg-transparent min-w-[100px]"
              onClick={() => setShowSplit(true)}
              disabled={!session.orders?.length}
            >
              <Users className="h-4 w-4" />
              Dividir
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 bg-transparent"
              onClick={() => {
                logAction('imprimir_cuenta', `Cuenta impresa - Mesa ${session.mesa} - Total $${session.total?.toFixed(2)}`, 'session', sessionId)
                const printWindow = window.open('', '_blank', 'width=400,height=600')
                if (!printWindow) return
                const orderLines = (session.orders || []).map(order =>
                  order.items.map(item => {
                    const extrasTotal = item.extras?.reduce((e: number, ex: { precio: number }) => e + ex.precio, 0) || 0
                    const itemTotal = (item.menuItem.precio + extrasTotal) * item.cantidad
                    let line = `<tr><td style="text-align:left">${item.cantidad}x ${item.menuItem.nombre}</td><td style="text-align:right">$${itemTotal.toFixed(2)}</td></tr>`
                    if (item.extras && item.extras.length > 0) {
                      line += item.extras.map((ex: { nombre: string; precio: number }) => `<tr><td style="padding-left:16px;font-size:11px;color:#666">+ ${ex.nombre}</td><td style="text-align:right;font-size:11px;color:#666">+$${ex.precio.toFixed(2)}</td></tr>`).join('')
                    }
                    if (item.notas) {
                      line += `<tr><td colspan="2" style="padding-left:16px;font-size:11px;color:#b45309;font-style:italic">Nota: ${item.notas}</td></tr>`
                    }
                    return line
                  }).join('')
                ).join('')

                printWindow.document.write(`<!DOCTYPE html><html><head><title>Recibo</title><style>
                  *{margin:0;padding:0;box-sizing:border-box}
                  body{font-family:'Courier New',monospace;font-size:13px;padding:16px;max-width:300px;margin:0 auto}
                  .center{text-align:center}
                  .bold{font-weight:bold}
                  .sep{border-top:1px dashed #999;margin:8px 0}
                  table{width:100%;border-collapse:collapse}
                  td{padding:2px 0;vertical-align:top}
                  .total-row td{font-weight:bold;font-size:15px;padding-top:6px;border-top:2px solid #000}
                  @media print{body{padding:0}}
                </style></head><body>
                  <div class="center bold" style="font-size:16px;margin-bottom:4px">Pa Que Vos Veais</div>
                  <div class="center" style="font-size:11px;color:#666;margin-bottom:8px">RESTAURANTE</div>
                  <div class="sep"></div>
                  <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span>Mesa: ${session.mesa}</span><span>${new Date().toLocaleDateString('es-MX')}</span></div>
                  <div style="font-size:11px;color:#666;margin-bottom:8px">${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div class="sep"></div>
                  <table>${orderLines}</table>
                  <div class="sep"></div>
                  <table>
                    <tr><td>Subtotal</td><td style="text-align:right">$${session.subtotal.toFixed(2)}</td></tr>
                    <tr><td>IVA</td><td style="text-align:right">$${session.impuestos.toFixed(2)}</td></tr>
                    ${currentDiscount > 0 ? `<tr><td style="color:green">Descuento</td><td style="text-align:right;color:green">-$${currentDiscount.toFixed(2)}</td></tr>` : ''}
                    ${currentTip > 0 ? `<tr><td>Propina</td><td style="text-align:right">$${currentTip.toFixed(2)}</td></tr>` : ''}
                    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">$${calculatedTotal.toFixed(2)}</td></tr>
                  </table>
                  ${selectedMethod ? `<div class="sep"></div><div class="center" style="font-size:11px">Metodo: ${selectedMethod === 'tarjeta' ? 'Tarjeta' : selectedMethod === 'apple_pay' ? 'Apple Pay' : 'Efectivo'}</div>` : ''}
                  <div class="sep"></div>
                  <div class="center" style="font-size:11px;color:#666;margin-top:8px">Gracias por su visita</div>
                  <div class="center" style="font-size:10px;color:#999">www.paquevosveais.com</div>
                </body></html>`)
                printWindow.document.close()
                printWindow.focus()
                setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
              }}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimir
            </Button>
            <Button
  className="flex-1 h-10 bg-success hover:bg-success/90 text-success-foreground"
  onClick={() => setShowConfirm(true)}
  disabled={!selectedMethod || isAlreadyPaid || calculatedTotal <= 0 || (isMixto && (!mixtoMethod2 || Math.abs((Number(mixtoAmount1)||0) + (Number(mixtoAmount2)||0) - calculatedTotal) > 0.01))}
>

              <Check className="h-4 w-4 mr-1.5" />
              Cobrar
            </Button>
          </div>
        </div>
        
        {/* Split Bill Dialog */}
        {showSplit && (
          <SplitBillDialog sessionId={sessionId} onClose={() => setShowSplit(false)} />
        )}

        {/* Confirmation Dialog */}
        {showConfirm && selectedMethod === 'tarjeta' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 rounded-xl">
            <Card className="w-full max-w-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">Pago con tarjeta</h3>
                  <span className="text-sm font-bold text-foreground">{formatPrice(calculatedTotal)}</span>
                </div>
                <StripePaymentForm
                  amount={calculatedTotal}
                  description={`Mesa ${session.mesa}`}
                  onSuccess={handleConfirmPayment}
                  onCancel={() => setShowConfirm(false)}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {showConfirm && selectedMethod !== 'tarjeta' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 rounded-xl">
            <Card className="w-full max-w-sm">
              <CardContent className="p-4 text-center">
                <Check className="h-12 w-12 mx-auto text-success mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">Confirmar cobro</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Total a cobrar: <span className="font-bold text-foreground">{formatPrice(calculatedTotal)}</span>
                  <br />
                  {isMixto && mixtoMethod2 ? (
                    <>
                      <span className="capitalize">{selectedMethod}</span>{' '}
                      <span className="font-bold text-foreground">{formatPrice(Number(mixtoAmount1)||0)}</span>
                      {' + '}
                      <span className="capitalize">{mixtoMethod2}</span>{' '}
                      <span className="font-bold text-foreground">{formatPrice(Number(mixtoAmount2)||0)}</span>
                    </>
                  ) : (
                    <>Método: <span className="capitalize">{selectedMethod}</span></>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                    onClick={handleConfirmPayment}
                    disabled={paying}
                  >
                    Confirmar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
