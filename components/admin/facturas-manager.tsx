'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Check, X, Clock, Mail, RefreshCw, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

interface SolicitudFactura {
  id: string
  session_id: string | null
  mesa: number | null
  total: number
  rfc: string
  razon_social: string
  regimen_fiscal: string
  uso_cfdi: string
  email: string
  cp: string
  status: 'pendiente' | 'procesada' | 'cancelada'
  notas: string | null
  created_at: string
}

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-800' },
  procesada:  { label: 'Procesada',  color: 'bg-green-100 text-green-800' },
  cancelada:  { label: 'Cancelada',  color: 'bg-red-100 text-red-800' },
}

export function FacturasManager() {
  const [solicitudes, setSolicitudes] = useState<SolicitudFactura[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('pendiente')

  const loadData = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('solicitudes_factura').select('*').order('created_at', { ascending: false })
    if (filterStatus !== 'todas') q = q.eq('status', filterStatus)
    const { data } = await q
    if (data) setSolicitudes(data as SolicitudFactura[])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { loadData() }, [loadData])

  const [emitting, setEmitting] = useState<string | null>(null)

  const handleStatus = async (id: string, status: SolicitudFactura['status']) => {
    await supabase.from('solicitudes_factura').update({ status }).eq('id', id)
    loadData()
  }

  const handleEmitirCFDI = async (id: string) => {
    setEmitting(id)
    try {
      const res = await fetch('/api/cfdi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId: id }),
      })
      const data = await res.json() as { status?: string; error?: string; cfdiId?: string }
      if (!res.ok) alert(`Error al emitir CFDI: ${data.error ?? 'Error desconocido'}`)
      else alert(`CFDI emitido correctamente. ID: ${data.cfdiId ?? '—'}`)
    } catch {
      alert('Error de conexión')
    } finally {
      setEmitting(null)
      loadData()
    }
  }

  const pendingCount = solicitudes.filter(s => s.status === 'pendiente').length

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Procesadas</p>
            <p className="text-xl font-bold text-green-600">{solicitudes.filter(s => s.status === 'procesada').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{solicitudes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-2 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="procesada">Procesadas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-9" onClick={loadData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Integración Facturama:</strong> Con <code>FACTURAMA_USER</code> y <code>FACTURAMA_PASSWORD</code> configurados, el botón <em>Emitir CFDI</em> timbra ante el SAT y envía el XML/PDF por correo automáticamente. Sin credenciales, usa <em>Manual OK</em> para marcar como procesada.
        </p>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin solicitudes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {solicitudes.map(s => (
            <Card key={s.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{s.rfc}</span>
                      <Badge className={`text-[10px] h-4 px-1.5 ${STATUS_CONFIG[s.status].color}`}>
                        {STATUS_CONFIG[s.status].label}
                      </Badge>
                      {s.mesa && <span className="text-xs text-muted-foreground">Mesa {s.mesa}</span>}
                    </div>
                    <p className="text-sm text-foreground">{s.razon_social}</p>
                    <div className="grid grid-cols-2 gap-x-4 mt-1 text-xs text-muted-foreground">
                      <span>Régimen: {s.regimen_fiscal}</span>
                      <span>Uso CFDI: {s.uso_cfdi}</span>
                      <span>CP: {s.cp}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Total: ${s.total.toFixed(2)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(s.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {s.notas && <p className="text-[11px] text-muted-foreground italic mt-1">{s.notas}</p>}
                  </div>
                  {s.status === 'pendiente' && (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2 bg-blue-600 hover:bg-blue-700 text-white gap-1"
                        onClick={() => handleEmitirCFDI(s.id)}
                        disabled={emitting === s.id}
                      >
                        {emitting === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                        Emitir CFDI
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2 bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => handleStatus(s.id, 'procesada')}
                      >
                        <Check className="h-3 w-3" />
                        Manual OK
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => handleStatus(s.id, 'cancelada')}
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
