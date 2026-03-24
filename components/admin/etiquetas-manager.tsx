'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import type { CustomEtiqueta } from '@/lib/store'

const COLOR_OPTIONS = [
  { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Verde' },
  { bg: 'bg-lime-100',   text: 'text-lime-800',   label: 'Lima' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Amarillo' },
  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rojo claro' },
  { bg: 'bg-red-200',    text: 'text-red-800',    label: 'Rojo' },
  { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Azul' },
  { bg: 'bg-sky-100',    text: 'text-sky-800',    label: 'Celeste' },
  { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'Ámbar' },
  { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Morado' },
  { bg: 'bg-pink-100',   text: 'text-pink-800',   label: 'Rosa' },
  { bg: 'bg-gray-100',   text: 'text-gray-800',   label: 'Gris' },
  { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Naranja' },
]

interface EditForm {
  emoji: string
  label: string
  colorBg: string
  colorText: string
}

const DEFAULT_FORM: EditForm = {
  emoji: '🏷️',
  label: '',
  colorBg: 'bg-gray-100',
  colorText: 'text-gray-800',
}

export function EtiquetasManager() {
  const { customEtiquetas, addCustomEtiqueta, updateCustomEtiqueta, deleteCustomEtiqueta } = useApp()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditForm>(DEFAULT_FORM)

  const startAdd = () => {
    setForm(DEFAULT_FORM)
    setEditingId(null)
    setAdding(true)
  }

  const startEdit = (etq: CustomEtiqueta) => {
    setForm({ emoji: etq.emoji, label: etq.label, colorBg: etq.colorBg, colorText: etq.colorText })
    setEditingId(etq.id)
    setAdding(false)
  }

  const cancel = () => { setAdding(false); setEditingId(null) }

  const saveNew = () => {
    if (!form.label.trim()) return
    addCustomEtiqueta({ ...form, activa: true, orden: customEtiquetas.length + 1 })
    setAdding(false)
  }

  const saveEdit = () => {
    if (!editingId || !form.label.trim()) return
    updateCustomEtiqueta(editingId, form)
    setEditingId(null)
  }

  const selectedColor = COLOR_OPTIONS.find(c => c.bg === form.colorBg) ?? COLOR_OPTIONS[10]

  const FormRow = () => (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
      <div className="flex gap-2 items-end">
        <div className="w-20">
          <Label className="text-xs">Emoji</Label>
          <Input
            value={form.emoji}
            onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))}
            className="h-8 text-center text-lg"
            maxLength={4}
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Nombre de la etiqueta</Label>
          <Input
            value={form.label}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
            placeholder="Ej: Sin azúcar, Halal, Orgánico…"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1.5 block">Color</Label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c.bg}
              type="button"
              onClick={() => setForm(p => ({ ...p, colorBg: c.bg, colorText: c.text }))}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border-2 transition-all ${c.bg} ${c.text} ${form.colorBg === c.bg ? 'border-foreground' : 'border-transparent'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs">Vista previa:</Label>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${form.colorBg} ${form.colorText}`}>
          {form.emoji} {form.label || 'Etiqueta'}
        </span>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={cancel}><X className="h-3.5 w-3.5 mr-1" />Cancelar</Button>
        <Button size="sm" onClick={adding ? saveNew : saveEdit}>
          <Check className="h-3.5 w-3.5 mr-1" />{adding ? 'Agregar' : 'Guardar'}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="p-4 max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">Etiquetas dietéticas</h2>
          <p className="text-xs text-muted-foreground">Se muestran en el menú para que los clientes filtren platillos</p>
        </div>
        <Button size="sm" onClick={startAdd} disabled={adding || !!editingId}>
          <Plus className="h-4 w-4 mr-1" />Nueva
        </Button>
      </div>

      {adding && <FormRow />}

      <div className="space-y-2">
        {customEtiquetas.map(etq => (
          <div key={etq.id} className="border rounded-lg p-3">
            {editingId === etq.id ? (
              <FormRow />
            ) : (
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${etq.colorBg} ${etq.colorText}`}>
                  {etq.emoji} {etq.label}
                </span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <Switch
                    checked={etq.activa}
                    onCheckedChange={v => updateCustomEtiqueta(etq.id, { activa: v })}
                    className="scale-75"
                  />
                  <span className="text-xs text-muted-foreground">{etq.activa ? 'Activa' : 'Oculta'}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(etq)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteCustomEtiqueta(etq.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {customEtiquetas.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground text-center py-6">No hay etiquetas. Agrega la primera.</p>
        )}
      </div>
    </div>
  )
}
