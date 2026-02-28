'use client'

import { useState } from 'react'
import { Settings, Percent, Clock, CreditCard, Bell, MapPin, Save, Check, AlertTriangle } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const DEFAULT_METODOS_PAGO = {
  efectivo: true,
  tarjeta: true,
  transferencia: true,
}

export function ConfigManager() {
  const { config, updateConfig, emergencyCloseAllTables, tableSessions } = useApp()
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)
  
  // Ensure all config fields have defaults for backwards compatibility
  const safeConfig = {
    ...config,
    metodospagoActivos: config.metodospagoActivos || DEFAULT_METODOS_PAGO,
    sonidoNuevosPedidos: config.sonidoNuevosPedidos ?? true,
    notificacionesStockBajo: config.notificacionesStockBajo ?? true,
  }
  
  const [localConfig, setLocalConfig] = useState({ ...safeConfig })
  const [saved, setSaved] = useState(false)
  
  const handleSave = () => {
    updateConfig(localConfig)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  
  const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(safeConfig)
  
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Configuracion del sistema
          </h2>
          <p className="text-[10px] text-muted-foreground">
            Ajusta los parametros del restaurante
          </p>
        </div>
        <Button 
          className={`h-7 text-[10px] px-2.5 ${saved ? 'bg-success' : 'bg-primary'}`}
          onClick={handleSave}
          disabled={!hasChanges && !saved}
        >
          {saved ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Guardado
            </>
          ) : (
            <>
              <Save className="h-3 w-3 mr-1" />
              Guardar
            </>
          )}
        </Button>
      </div>
      
      <div className="space-y-3">
        {/* Taxes */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-primary" />
              Impuestos y cargos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px]">IVA (%)</Label>
                <Input
                  type="number"
                  value={localConfig.impuestoPorcentaje}
                  onChange={(e) => setLocalConfig(prev => ({ 
                    ...prev, 
                    impuestoPorcentaje: Number.parseFloat(e.target.value) || 0 
                  }))}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px]">Propina sugerida (%)</Label>
                <Input
                  type="number"
                  value={localConfig.propinaSugeridaPorcentaje}
                  onChange={(e) => setLocalConfig(prev => ({ 
                    ...prev, 
                    propinaSugeridaPorcentaje: Number.parseFloat(e.target.value) || 0 
                  }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Session */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Sesiones de mesa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div>
              <Label className="text-[10px]">Tiempo expiracion sesion (minutos)</Label>
              <Input
                type="number"
                value={localConfig.tiempoExpiracionSesionMinutos}
                onChange={(e) => setLocalConfig(prev => ({ 
                  ...prev, 
                  tiempoExpiracionSesionMinutos: Number.parseInt(e.target.value) || 60 
                }))}
                className="h-8 text-xs"
              />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Tiempo que dura una sesion de mesa sin actividad
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Payment Methods */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Metodos de pago
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Efectivo</Label>
              <Switch
                checked={localConfig.metodospagoActivos.efectivo}
                onCheckedChange={(checked) => setLocalConfig(prev => ({ 
                  ...prev, 
                  metodospagoActivos: { ...prev.metodospagoActivos, efectivo: checked }
                }))}
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Tarjeta</Label>
              <Switch
                checked={localConfig.metodospagoActivos.tarjeta}
                onCheckedChange={(checked) => setLocalConfig(prev => ({ 
                  ...prev, 
                  metodospagoActivos: { ...prev.metodospagoActivos, tarjeta: checked }
                }))}
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Transferencia</Label>
              <Switch
                checked={localConfig.metodospagoActivos.transferencia}
                onCheckedChange={(checked) => setLocalConfig(prev => ({ 
                  ...prev, 
                  metodospagoActivos: { ...prev.metodospagoActivos, transferencia: checked }
                }))}
                className="scale-75"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Delivery Zones */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Zonas de reparto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {localConfig.zonasReparto.map((zona, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={zona}
                    onChange={(e) => {
                      const newZonas = [...localConfig.zonasReparto]
                      newZonas[index] = e.target.value
                      setLocalConfig(prev => ({ ...prev, zonasReparto: newZonas }))
                    }}
                    className="h-8 text-xs flex-1"
                    placeholder="Nombre de zona"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-destructive bg-transparent"
                    onClick={() => {
                      const newZonas = localConfig.zonasReparto.filter((_, i) => i !== index)
                      setLocalConfig(prev => ({ ...prev, zonasReparto: newZonas }))
                    }}
                  >
                    X
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs bg-transparent"
                onClick={() => setLocalConfig(prev => ({ 
                  ...prev, 
                  zonasReparto: [...prev.zonasReparto, ''] 
                }))}
              >
                + Agregar zona
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Notifications */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[10px]">Sonido de nuevos pedidos</Label>
                <p className="text-[9px] text-muted-foreground">Reproduce sonido al recibir pedidos</p>
              </div>
              <Switch
                checked={localConfig.sonidoNuevosPedidos}
                onCheckedChange={(checked) => setLocalConfig(prev => ({ 
                  ...prev, 
                  sonidoNuevosPedidos: checked 
                }))}
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[10px]">Notificaciones de stock bajo</Label>
                <p className="text-[9px] text-muted-foreground">Alerta cuando un ingrediente esta bajo</p>
              </div>
              <Switch
                checked={localConfig.notificacionesStockBajo}
                onCheckedChange={(checked) => setLocalConfig(prev => ({ 
                  ...prev, 
                  notificacionesStockBajo: checked 
                }))}
                className="scale-75"
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Close All Tables */}
        <Card className="border-destructive/50">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Acciones de emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-[9px] text-muted-foreground mb-2">
              Cierra todas las sesiones de mesa activas. Los pedidos activos asociados se eliminan. El historial no se borra.
            </p>
            {(() => {
              const activeSessions = tableSessions.filter(s => s.activa)
              return (
                <>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Sesiones activas: <span className="font-semibold text-foreground">{activeSessions.length}</span>
                  </p>
                  {!showEmergencyConfirm ? (
                    <Button
                      variant="outline"
                      className="w-full h-8 text-xs border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
                      onClick={() => setShowEmergencyConfirm(true)}
                      disabled={activeSessions.length === 0}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1.5" />
                      Cerrar mesas (emergencia)
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-8 text-xs bg-transparent"
                        onClick={() => setShowEmergencyConfirm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1 h-8 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        onClick={() => {
                          emergencyCloseAllTables()
                          setShowEmergencyConfirm(false)
                        }}
                      >
                        Confirmar cierre
                      </Button>
                    </div>
                  )}
                </>
              )
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
