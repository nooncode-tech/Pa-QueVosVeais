'use client'

import { useState, useEffect } from 'react'
import { Search, Phone, MapPin, User, TrendingUp, Clock, Edit2, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/store'

interface Cliente {
  id: string
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  zona_reparto?: string
  total_pedidos: number
  total_gastado: number
  ultimo_pedido?: string
  notas?: string
  created_at: string
}

const EMPTY_FORM = {
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
  zona_reparto: '',
  notas: '',
}

export function CrmManager() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadClientes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('ultimo_pedido', { ascending: false, nullsFirst: false })
    if (data) setClientes(data as Cliente[])
    setLoading(false)
  }

  useEffect(() => {
    loadClientes()
    const channel = supabase
      .channel('crm-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, loadClientes)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleSave = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    const payload = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      zona_reparto: form.zona_reparto.trim() || null,
      notas: form.notas.trim() || null,
    }
    if (editingId) {
      await supabase.from('clientes').update(payload).eq('id', editingId)
    } else {
      await supabase.from('clientes').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    loadClientes()
  }

  const handleEdit = (c: Cliente) => {
    setForm({
      nombre: c.nombre,
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      direccion: c.direccion ?? '',
      zona_reparto: c.zona_reparto ?? '',
      notas: c.notas ?? '',
    })
    setEditingId(c.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    loadClientes()
  }

  const filtered = clientes.filter(c =>
    !searchTerm ||
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats
  const totalClientes = clientes.length
  const totalGastado = clientes.reduce((s, c) => s + c.total_gastado, 0)
  const topCliente = clientes[0]

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Clientes</p>
            <p className="text-xl font-bold">{totalClientes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Gastado total</p>
            <p className="text-xl font-bold">{formatPrice(totalGastado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Top cliente</p>
            <p className="text-sm font-bold truncate">{topCliente?.nombre ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre, teléfono o email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}
        >
          <User className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              {editingId ? 'Editar cliente' : 'Nuevo cliente'}
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+52 55 ..." className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@..." className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Zona de reparto</Label>
                <Input value={form.zona_reparto} onChange={e => setForm(f => ({ ...f, zona_reparto: e.target.value }))} placeholder="Zona..." className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Dirección</Label>
              <Input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Calle, número, colonia..." className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Alergias, preferencias, etc." rows={2} className="text-sm" />
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
          <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin clientes registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{c.nombre}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {c.telefono && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefono}</span>
                      )}
                      {c.direccion && (
                        <span className="flex items-center gap-1 truncate max-w-[180px]"><MapPin className="h-3 w-3" />{c.direccion}</span>
                      )}
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{c.total_pedidos} pedidos · {formatPrice(c.total_gastado)}</span>
                      {c.ultimo_pedido && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(c.ultimo_pedido).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                    {c.notas && <p className="text-[11px] text-muted-foreground mt-1 italic">{c.notas}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(c)} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
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
