'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice, type Promocion } from '@/lib/store'

const COLOR_OPTIONS = [
  { value: 'orange', label: 'Naranja', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { value: 'green', label: 'Verde', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { value: 'blue', label: 'Azul', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { value: 'red', label: 'Rojo', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { value: 'purple', label: 'Morado', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
]

function getColorClasses(color: string) {
  return COLOR_OPTIONS.find(c => c.value === color) ?? COLOR_OPTIONS[0]
}

interface PromoFormState {
  titulo: string
  descripcion: string
  tipo: 'porcentaje' | 'monto_fijo'
  valor: string
  activa: boolean
  fechaInicio: string
  fechaFin: string
  color: string
}

const EMPTY_FORM: PromoFormState = {
  titulo: '',
  descripcion: '',
  tipo: 'porcentaje',
  valor: '',
  activa: true,
  fechaInicio: '',
  fechaFin: '',
  color: 'orange',
}

export function PromocionesManager() {
  const { promociones, addPromocion, updatePromocion, deletePromocion } = useApp()
  const [editing, setEditing] = useState<string | null>(null) // promo id or 'new'
  const [form, setForm] = useState<PromoFormState>(EMPTY_FORM)

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditing('new')
  }

  const openEdit = (promo: Promocion) => {
    setForm({
      titulo: promo.titulo,
      descripcion: promo.descripcion,
      tipo: promo.tipo,
      valor: String(promo.valor),
      activa: promo.activa,
      fechaInicio: promo.fechaInicio ?? '',
      fechaFin: promo.fechaFin ?? '',
      color: promo.color,
    })
    setEditing(promo.id)
  }

  const handleSave = () => {
    const valor = parseFloat(form.valor)
    if (!form.titulo.trim() || isNaN(valor) || valor <= 0) return

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      valor,
      activa: form.activa,
      fechaInicio: form.fechaInicio || undefined,
      fechaFin: form.fechaFin || undefined,
      color: form.color,
    }

    if (editing === 'new') {
      addPromocion(payload)
    } else if (editing) {
      updatePromocion(editing, payload)
    }
    setEditing(null)
  }

  const toggleActiva = (promo: Promocion) => {
    updatePromocion(promo.id, { activa: !promo.activa })
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">Promociones</h2>
          <p className="text-xs text-muted-foreground">Los clientes ven las promociones activas al pedir la cuenta</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="h-4 w-4" />
          Nueva
        </Button>
      </div>

      {/* Form */}
      {editing !== null && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/30">
          <p className="text-sm font-semibold">{editing === 'new' ? 'Nueva Promoción' : 'Editar Promoción'}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Título *</label>
              <Input
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej. 2x1 en bebidas"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Descripción</label>
              <Input
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalles del descuento"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as PromoFormState['tipo'] }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto fijo ($)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">
                Valor {form.tipo === 'porcentaje' ? '(%)' : '($)'}*
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                placeholder={form.tipo === 'porcentaje' ? '10' : '50'}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Color</label>
              <select
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {COLOR_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Fecha inicio (opcional)</label>
              <Input
                type="date"
                value={form.fechaInicio}
                onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Fecha fin (opcional)</label>
              <Input
                type="date"
                value={form.fechaFin}
                onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium">Activa ahora</label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, activa: !f.activa }))}
              className={form.activa ? 'text-primary' : 'text-muted-foreground'}
            >
              {form.activa
                ? <ToggleRight className="h-6 w-6" />
                : <ToggleLeft className="h-6 w-6" />
              }
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave}>Guardar</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* List */}
      {promociones.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No hay promociones aún. Crea una para que los clientes la vean.
        </div>
      ) : (
        <div className="space-y-2">
          {promociones.map(promo => {
            const colors = getColorClasses(promo.color)
            return (
              <div
                key={promo.id}
                className={`flex items-start gap-3 rounded-xl border p-3 ${colors.bg} ${colors.border}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${colors.text}`}>{promo.titulo}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${promo.activa ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                      {promo.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {promo.descripcion && (
                    <p className={`text-xs mt-0.5 ${colors.text} opacity-80`}>{promo.descripcion}</p>
                  )}
                  <p className={`text-xs mt-1 font-medium ${colors.text}`}>
                    {promo.tipo === 'porcentaje'
                      ? `${promo.valor}% de descuento`
                      : `${formatPrice(promo.valor)} de descuento`
                    }
                    {(promo.fechaInicio || promo.fechaFin) && (
                      <span className="font-normal opacity-70 ml-1">
                        · {promo.fechaInicio ?? '∞'} → {promo.fechaFin ?? '∞'}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActiva(promo)}
                    title={promo.activa ? 'Desactivar' : 'Activar'}
                    className={`p-1.5 rounded-lg transition-colors ${colors.text} hover:bg-white/50`}
                  >
                    {promo.activa ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => openEdit(promo)}
                    title="Editar"
                    className={`p-1.5 rounded-lg transition-colors ${colors.text} hover:bg-white/50`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deletePromocion(promo.id)}
                    title="Eliminar"
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
