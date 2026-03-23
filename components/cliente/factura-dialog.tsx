'use client'

import { useState } from 'react'
import { X, FileText, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const REGIMENES = [
  '601 - General de Ley Personas Morales',
  '603 - Personas Morales con Fines no Lucrativos',
  '605 - Sueldos y Salarios',
  '606 - Arrendamiento',
  '607 - Enajenación de Bienes',
  '608 - Demás ingresos',
  '609 - Consolidación',
  '610 - Residentes en el Extranjero',
  '611 - Ingresos por Dividendos',
  '612 - Personas Físicas con Actividades Empresariales',
  '614 - Ingresos por intereses',
  '616 - Sin obligaciones fiscales',
  '620 - Sociedades Cooperativas',
  '621 - Incorporación Fiscal',
  '622 - Actividades Agrícolas',
  '623 - Opcional para Grupos de Sociedades',
  '624 - Coordinados',
  '625 - Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
  '626 - Régimen Simplificado de Confianza',
]

const USOS_CFDI = [
  'G01 - Adquisición de bienes',
  'G02 - Devoluciones, descuentos o bonificaciones',
  'G03 - Gastos en general',
  'I01 - Construcciones',
  'I02 - Mobilario y equipo de oficina',
  'I03 - Equipo de transporte',
  'I04 - Equipo de computo',
  'I05 - Dados, troqueles, moldes, matrices y herramental',
  'I06 - Comunicaciones telefónicas',
  'I07 - Comunicaciones satelitales',
  'I08 - Otra maquinaria y equipo',
  'D01 - Honorarios médicos, dentales y hospitalarios',
  'D02 - Gastos médicos por incapacidad o discapacidad',
  'D03 - Gastos funerales',
  'D04 - Donativos',
  'D05 - Intereses reales efectivamente pagados por créditos hipotecarios',
  'D06 - Aportaciones voluntarias al SAR',
  'D07 - Primas por seguros de gastos médicos',
  'D08 - Gastos de transportación escolar obligatoria',
  'D09 - Depósitos en cuentas para el ahorro, primas de pensiones',
  'D10 - Pagos por servicios educativos',
  'S01 - Sin efectos fiscales',
  'CP01 - Pagos',
  'CN01 - Nómina',
]

interface FacturaDialogProps {
  sessionId: string
  mesa: number
  total: number
  onClose: () => void
}

export function FacturaDialog({ sessionId, mesa, total, onClose }: FacturaDialogProps) {
  const [form, setForm] = useState({
    rfc: '',
    razonSocial: '',
    regimenFiscal: '',
    usoCfdi: 'G03 - Gastos en general',
    email: '',
    cp: '',
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [emitida, setEmitida] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.rfc.trim() || !form.razonSocial.trim() || !form.regimenFiscal || !form.email.trim() || !form.cp.trim()) {
      setError('Todos los campos son requeridos')
      return
    }
    const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/
    if (!rfcPattern.test(form.rfc.toUpperCase().trim())) {
      setError('RFC inválido (ej. XAXX010101000)')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/cfdi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          mesa,
          total,
          rfc: form.rfc.toUpperCase().trim(),
          razon_social: form.razonSocial.trim().toUpperCase(),
          regimen_fiscal: form.regimenFiscal,
          uso_cfdi: form.usoCfdi,
          email: form.email.trim().toLowerCase(),
          cp: form.cp.trim(),
        }),
      })
      const data = await res.json() as { status: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Error al enviar solicitud.'); return }
      setEmitida(data.status === 'emitida')
      setDone(true)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-background rounded-xl w-full max-w-sm p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          {emitida ? (
            <>
              <h2 className="text-lg font-bold">¡Factura emitida!</h2>
              <p className="text-sm text-muted-foreground">
                Tu CFDI fue timbrado ante el SAT y enviado a <strong>{form.email}</strong>.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold">Solicitud recibida</h2>
              <p className="text-sm text-muted-foreground">
                Recibirás tu factura en <strong>{form.email}</strong> a más tardar en 72 horas hábiles.
              </p>
            </>
          )}
          <Button className="w-full" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">Solicitar Factura (CFDI)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-secondary/50 rounded-lg p-3 flex justify-between text-sm">
            <span className="text-muted-foreground">Total a facturar:</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">RFC *</Label>
              <Input
                value={form.rfc}
                onChange={e => setForm(f => ({ ...f, rfc: e.target.value.toUpperCase() }))}
                placeholder="XAXX010101000"
                className="h-9 text-sm uppercase"
                maxLength={13}
              />
            </div>
            <div>
              <Label className="text-xs">Razón social *</Label>
              <Input
                value={form.razonSocial}
                onChange={e => setForm(f => ({ ...f, razonSocial: e.target.value.toUpperCase() }))}
                placeholder="NOMBRE O EMPRESA S.A. DE C.V."
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Régimen fiscal *</Label>
              <Select value={form.regimenFiscal} onValueChange={v => setForm(f => ({ ...f, regimenFiscal: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {REGIMENES.map(r => (
                    <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Uso CFDI *</Label>
              <Select value={form.usoCfdi} onValueChange={v => setForm(f => ({ ...f, usoCfdi: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USOS_CFDI.map(u => (
                    <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Código postal *</Label>
                <Input
                  value={form.cp}
                  onChange={e => setForm(f => ({ ...f, cp: e.target.value }))}
                  placeholder="06600"
                  className="h-9 text-sm"
                  maxLength={5}
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label className="text-xs">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1 gap-1.5" onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Emitiendo...' : 'Solicitar factura'}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Datos conforme al SAT. Recibirás el XML y PDF por correo.
          </p>
        </div>
      </div>
    </div>
  )
}
