'use client'

import { useState, useEffect } from 'react'
import { Plus, MapPin, Phone, Edit2, Trash2, X, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

interface Sucursal {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  activa: boolean
  created_at: string
}

const EMPTY_FORM = { nombre: '', direccion: '', telefono: '', activa: true }

export function SucursalesManager() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('sucursales').select('*').order('created_at')
    if (data) setSucursales(data as Sucursal[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    const payload = {
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim() || null,
      telefono: form.telefono.trim() || null,
      activa: form.activa,
    }
    if (editingId) {
      await supabase.from('sucursales').update(payload).eq('id', editingId)
    } else {
      await supabase.from('sucursales').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    load()
  }

  const handleEdit = (s: Sucursal) => {
    setForm({ nombre: s.nombre, direccion: s.direccion ?? '', telefono: s.telefono ?? '', activa: s.activa })
    setEditingId(s.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta sucursal?')) return
    await supabase.from('sucursales').delete().eq('id', id)
    load()
  }

  const handleToggleActiva = async (id: string, activa: boolean) => {
    await supabase.from('sucursales').update({ activa }).eq('id', id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
        <strong>Multi-sucursal básico:</strong> Registra y gestiona cada sucursal. Para aislamiento completo de datos por sucursal (menú, órdenes, empleados independientes), cada sucursal debe tener su propio proyecto de Supabase.
      </div>

      {/* Controls */}
      <div className="flex justify-end">
        <Button
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}
        >
          <Plus className="h-4 w-4" />
          Nueva sucursal
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              {editingId ? 'Editar sucursal' : 'Nueva sucursal'}
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div>
              <Label className="text-xs">Nombre *</Label>
              <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Pa' Que Vos Veais - Centro" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Dirección</Label>
              <Input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Insurgentes Sur 123, CDMX" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Teléfono</Label>
              <Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+52 55 1234 5678" className="h-8 text-sm" />
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
      ) : sucursales.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin sucursales registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sucursales.map(s => (
            <Card key={s.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{s.nombre}</span>
                      <Badge className={`text-[10px] h-4 px-1.5 ${s.activa ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
                        {s.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    {s.direccion && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />{s.direccion}
                      </p>
                    )}
                    {s.telefono && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 flex-shrink-0" />{s.telefono}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActiva(s.id, !s.activa)}
                      className={`px-2 py-1 rounded-md text-[10px] border transition-colors ${s.activa ? 'border-border text-muted-foreground hover:border-destructive/50' : 'border-green-200 text-green-700 hover:border-green-400'}`}
                    >
                      {s.activa ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => handleEdit(s)} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
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
