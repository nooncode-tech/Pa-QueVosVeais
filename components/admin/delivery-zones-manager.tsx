'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, MapPin, Clock, DollarSign } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DeliveryZone } from '@/lib/store'

export function DeliveryZonesManager() {
  const { deliveryZones, updateDeliveryZone, addDeliveryZone, deleteDeliveryZone } = useApp()
  const [confirmDeleteZone, setConfirmDeleteZone] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    costoEnvio: 0,
    tiempoEstimado: 30,
    activa: true,
  })
  
  const resetForm = () => {
    setFormData({
      nombre: '',
      costoEnvio: 0,
      tiempoEstimado: 30,
      activa: true,
    })
  }
  
  const handleAdd = () => {
    const nombre = formData.nombre.trim()
    if (!nombre) return
    if (deliveryZones.some(z => z.nombre.toLowerCase() === nombre.toLowerCase())) return

    addDeliveryZone({
      nombre,
      costoEnvio: formData.costoEnvio,
      tiempoEstimado: formData.tiempoEstimado,
      activa: formData.activa,
    })

    resetForm()
    setShowAddDialog(false)
  }
  
  const handleEdit = () => {
    if (!editingZone) return
    
    updateDeliveryZone(editingZone.nombre, {
      costoEnvio: formData.costoEnvio,
      tiempoEstimado: formData.tiempoEstimado,
      activa: formData.activa,
    })
    
    setEditingZone(null)
    resetForm()
  }
  
  const openEditDialog = (zone: DeliveryZone) => {
    setEditingZone(zone)
    setFormData({
      nombre: zone.nombre,
      costoEnvio: zone.costoEnvio,
      tiempoEstimado: zone.tiempoEstimado,
      activa: zone.activa,
    })
  }
  
  const toggleZoneActive = (zoneName: string, currentState: boolean) => {
    updateDeliveryZone(zoneName, { activa: !currentState })
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)
  }
  
  const activeZones = deliveryZones.filter(z => z.activa).length
  const totalZones = deliveryZones.length
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Zonas de Reparto</h2>
          <p className="text-sm text-muted-foreground">
            {activeZones} de {totalZones} zonas activas
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Zona
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zona</TableHead>
                <TableHead className="text-right">Costo Envio</TableHead>
                <TableHead className="text-right">Tiempo Est.</TableHead>
                <TableHead className="text-center">Activa</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryZones.map((zone) => (
                <TableRow key={zone.nombre} className={!zone.activa ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {zone.nombre}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {formatPrice(zone.costoEnvio)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {zone.tiempoEstimado} min
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={zone.activa}
                      onCheckedChange={() => toggleZoneActive(zone.nombre, zone.activa)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(zone)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {confirmDeleteZone === zone.nombre ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          onClick={() => { deleteDeliveryZone(zone.nombre); setConfirmDeleteZone(null) }}
                        >
                          ¿Confirmar?
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmDeleteZone(zone.nombre)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add Zone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Zona de Reparto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de la Zona</Label>
              <Input
                placeholder="Ej: Polanco, Roma Norte..."
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Costo de Envio ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.costoEnvio}
                  onChange={(e) => setFormData(prev => ({ ...prev, costoEnvio: Number(e.target.value) }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tiempo Estimado (min)</Label>
                <Input
                  type="number"
                  min="10"
                  step="5"
                  value={formData.tiempoEstimado}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiempoEstimado: Number(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Zona Activa</Label>
              <Switch
                checked={formData.activa}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activa: checked }))}
              />
            </div>
          </div>
          
          {formData.nombre.trim() && deliveryZones.some(z => z.nombre.toLowerCase() === formData.nombre.trim().toLowerCase()) && (
            <p className="text-xs text-destructive px-1">Ya existe una zona con ese nombre.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!formData.nombre.trim() || deliveryZones.some(z => z.nombre.toLowerCase() === formData.nombre.trim().toLowerCase())}
            >
              Agregar Zona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Zone Dialog */}
      <Dialog open={!!editingZone} onOpenChange={() => setEditingZone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Zona: {editingZone?.nombre}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Costo de Envio ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.costoEnvio}
                  onChange={(e) => setFormData(prev => ({ ...prev, costoEnvio: Number(e.target.value) }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tiempo Estimado (min)</Label>
                <Input
                  type="number"
                  min="10"
                  step="5"
                  value={formData.tiempoEstimado}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiempoEstimado: Number(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Zona Activa</Label>
              <Switch
                checked={formData.activa}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activa: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingZone(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
