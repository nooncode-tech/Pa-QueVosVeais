'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Gift, Percent, DollarSign } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { Reward } from '@/lib/store'

const ACCION_LABELS: Record<Reward['accion'], string> = {
  seguir_instagram: 'Seguir en Instagram',
  primera_visita: 'Primera Visita',
  cumpleanos: 'Cumpleaños',
  referido: 'Referido',
}

const TIPO_LABELS: Record<Reward['tipo'], string> = {
  porcentaje: 'Porcentaje',
  monto_fijo: 'Monto Fijo',
}

const defaultForm = {
  nombre: '',
  descripcion: '',
  tipo: 'porcentaje' as Reward['tipo'],
  valor: 10,
  accion: 'primera_visita' as Reward['accion'],
  activo: true,
  usosMaximos: 1 as number | undefined,
}

export function RewardsManager() {
  const { rewards, addReward, updateReward, deleteReward } = useApp()
  const [showDialog, setShowDialog] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const openAdd = () => {
    setEditingReward(null)
    setForm(defaultForm)
    setShowDialog(true)
  }

  const openEdit = (r: Reward) => {
    setEditingReward(r)
    setForm({
      nombre: r.nombre,
      descripcion: r.descripcion,
      tipo: r.tipo,
      valor: r.valor,
      accion: r.accion,
      activo: r.activo,
      usosMaximos: r.usosMaximos,
    })
    setShowDialog(true)
  }

  const handleSave = () => {
    if (!form.nombre.trim()) return
    if (editingReward) {
      updateReward(editingReward.id, form)
    } else {
      addReward(form)
    }
    setShowDialog(false)
  }

  const handleDelete = (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    deleteReward(id)
    setConfirmDelete(null)
  }

  const formatValue = (r: Reward) =>
    r.tipo === 'porcentaje' ? `${r.valor}%` : `$${r.valor}`

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" /> Recompensas
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {rewards.filter(r => r.activo).length} de {rewards.length} activas
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Nueva
        </Button>
      </div>

      <div className="space-y-2">
        {rewards.map(r => (
          <Card key={r.id} className={!r.activo ? 'opacity-50' : ''}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold">{r.nombre}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {r.tipo === 'porcentaje'
                        ? <><Percent className="h-2.5 w-2.5 mr-0.5 inline" />{formatValue(r)}</>
                        : <><DollarSign className="h-2.5 w-2.5 mr-0.5 inline" />{formatValue(r)}</>}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {ACCION_LABELS[r.accion]}
                    </Badge>
                    {!r.activo && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Inactiva</Badge>}
                  </div>
                  {r.descripcion && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{r.descripcion}</p>
                  )}
                  {r.usosMaximos && (
                    <p className="text-[10px] text-muted-foreground">Límite: {r.usosMaximos} uso{r.usosMaximos !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  {confirmDelete === r.id ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-[10px] px-2"
                      onClick={() => handleDelete(r.id)}
                    >
                      ¿Confirmar?
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rewards.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No hay recompensas configuradas</p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingReward ? 'Editar Recompensa' : 'Nueva Recompensa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Nombre</Label>
              <Input
                className="h-8 text-xs"
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Primera Visita"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descripción</Label>
              <Input
                className="h-8 text-xs"
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción breve"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as Reward['tipo'] }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_LABELS) as Reward['tipo'][]).map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{TIPO_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{form.tipo === 'porcentaje' ? 'Valor (%)' : 'Valor ($)'}</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  min={0}
                  value={form.valor}
                  onChange={e => setForm(p => ({ ...p, valor: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Acción que la activa</Label>
              <Select value={form.accion} onValueChange={v => setForm(p => ({ ...p, accion: v as Reward['accion'] }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACCION_LABELS) as Reward['accion'][]).map(a => (
                    <SelectItem key={a} value={a} className="text-xs">{ACCION_LABELS[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Usos máximos por sesión (vacío = ilimitado)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={1}
                placeholder="Ej: 1"
                value={form.usosMaximos ?? ''}
                onChange={e => setForm(p => ({ ...p, usosMaximos: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Activa</Label>
              <Switch checked={form.activo} onCheckedChange={v => setForm(p => ({ ...p, activo: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.nombre.trim()}>
              {editingReward ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
