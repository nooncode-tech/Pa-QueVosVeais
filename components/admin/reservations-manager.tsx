'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Phone, Users, Calendar, Clock, X, Check, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

interface Reservacion {
  id: string
  nombre: string
  telefono?: string
  fecha: string
  hora: string
  personas: number
  mesa?: number
  notas?: string
  status: 'confirmada' | 'llegaron' | 'cancelada' | 'no-show'
  created_at: string
}

const STATUS_CONFIG = {
  confirmada: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
  llegaron:   { label: 'Llegaron',   color: 'bg-green-100 text-green-800' },
  cancelada:  { label: 'Cancelada',  color: 'bg-red-100 text-red-800' },
  'no-show':  { label: 'No show',    color: 'bg-amber-100 text-amber-800' },
} as const

const EMPTY_FORM = {
  nombre: '',
  telefono: '',
  fecha: new Date().toISOString().split('T')[0],
  hora: '20:00',
  personas: '2',
  mesa: '',
  notas: '',
  status: 'confirmada' as Reservacion['status'],
}

export function ReservationsManager() {
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFecha, setFilterFecha] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadReservaciones = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reservaciones')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
    if (data) setReservaciones(data as Reservacion[])
    setLoading(false)
  }

  useEffect(() => {
    loadReservaciones()

    const channel = supabase
      .channel('reservaciones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservaciones' }, () => {
        loadReservaciones()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.fecha || !form.hora) return
    setSaving(true)

    const payload = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      fecha: form.fecha,
      hora: form.hora,
      personas: parseInt(form.personas) || 2,
      mesa: form.mesa ? parseInt(form.mesa) : null,
      notas: form.notas.trim() || null,
      status: form.status,
    }

    if (editingId) {
      await supabase.from('reservaciones').update(payload).eq('id', editingId)
    } else {
      await supabase.from('reservaciones').insert(payload)
    }

    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    loadReservaciones()
  }

  const handleEdit = (r: Reservacion) => {
    setForm({
      nombre: r.nombre,
      telefono: r.telefono ?? '',
      fecha: r.fecha,
      hora: r.hora,
      personas: r.personas.toString(),
      mesa: r.mesa?.toString() ?? '',
      notas: r.notas ?? '',
      status: r.status,
    })
    setEditingId(r.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta reservación?')) return
    await supabase.from('reservaciones').delete().eq('id', id)
    loadReservaciones()
  }

  const handleStatusChange = async (id: string, status: Reservacion['status']) => {
    await supabase.from('reservaciones').update({ status }).eq('id', id)
    loadReservaciones()
  }

  const filtered = reservaciones.filter(r => {
    const matchDate = !filterFecha || r.fecha === filterFecha
    const matchSearch = !searchTerm ||
      r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.telefono?.includes(searchTerm)
    return matchDate && matchSearch
  })

  // Stats for selected date
  const todayReservations = reservaciones.filter(r => r.fecha === filterFecha)
  const totalPersonas = todayReservations.reduce((sum, r) => sum + r.personas, 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Reservaciones</p>
            <p className="text-xl font-bold">{todayReservations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Personas esperadas</p>
            <p className="text-xl font-bold">{totalPersonas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Confirmadas</p>
            <p className="text-xl font-bold text-blue-600">
              {todayReservations.filter(r => r.status === 'confirmada').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap items-center">
        <Input
          type="date"
          value={filterFecha}
          onChange={e => setFilterFecha(e.target.value)}
          className="w-40 h-9 text-sm"
        />
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre o teléfono..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => { setForm({ ...EMPTY_FORM, fecha: filterFecha }); setEditingId(null); setShowForm(true) }}
        >
          <Plus className="h-4 w-4" />
          Nueva
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              {editingId ? 'Editar reservación' : 'Nueva reservación'}
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del cliente" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+52 55 ..." className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Fecha *</Label>
                <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Hora *</Label>
                <Input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Personas</Label>
                <Input type="number" min="1" max="20" value={form.personas} onChange={e => setForm(f => ({ ...f, personas: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Mesa (opcional)</Label>
                <Input type="number" min="1" value={form.mesa} onChange={e => setForm(f => ({ ...f, mesa: e.target.value }))} placeholder="Nº mesa" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Estado</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Reservacion['status'] }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-sm">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Alergias, ocasión especial, preferencias..." rows={2} className="text-sm" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}>Cancelar</Button>
              <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving || !form.nombre.trim()}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin reservaciones para esta fecha</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className="border">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{r.nombre}</span>
                      <Badge className={`text-[10px] h-4 px-1.5 ${STATUS_CONFIG[r.status]?.color ?? ''}`}>
                        {STATUS_CONFIG[r.status]?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.hora.slice(0, 5)}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.personas} personas</span>
                      {r.mesa && <span className="flex items-center gap-1">Mesa {r.mesa}</span>}
                      {r.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.telefono}</span>}
                    </div>
                    {r.notas && <p className="text-[11px] text-muted-foreground mt-1 italic">{r.notas}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {r.status === 'confirmada' && (
                      <button
                        onClick={() => handleStatusChange(r.id, 'llegaron')}
                        className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        title="Marcar llegaron"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
