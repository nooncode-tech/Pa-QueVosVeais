'use client'

import { useState } from 'react'
import { Plus, AlertTriangle, Package, TrendingDown, TrendingUp, Edit2 } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {  Dialog,  DialogContent,  DialogHeader,  DialogTitle,} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Ingredient, IngredientCategory } from '@/lib/store'
import { DEFAULT_INGREDIENT_CATEGORIES } from '@/lib/store'

export function InventoryManager() {
  const { 
  ingredients, 
  menuItems, 
  getLowStockIngredients, 
  adjustInventory, 
  updateIngredient, 
  addIngredient 
} = useApp()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAdjustDialog, setShowAdjustDialog] = useState<Ingredient | null>(null)
  const [showAdvancedDialog, setShowAdvancedDialog] = useState<Ingredient | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'low'>('all')
  
  const lowStockItems = getLowStockIngredients().filter(
  i => i.activo !== false
)
  const isIngredientInUse = (ingredientId: string) => {
  return menuItems.some(menuItem =>
    menuItem.ingredients?.some(ing => ing.ingredientId === ingredientId)
  )
}
const handleDeactivateIngredient = (id: string) => {
  if (isIngredientInUse(id)) {
    alert("No se puede eliminar este ingrediente porque está en uso en el menú.")
    return
  }

  if (!confirm("¿Seguro que quieres eliminar este ingrediente?")) return

  updateIngredient(id, { activo: false })
}
const activeIngredients = ingredients.filter(i => i.activo !== false)
const activeLowStock = lowStockItems.filter(i => i.activo !== false)

const displayItems = activeTab === 'low' ? activeLowStock : activeIngredients
  
  return (
    <div className="p-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Card className="bg-secondary/50">
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-foreground">{ingredients.length}</p>
            <p className="text-[9px] text-muted-foreground">Ingredientes</p>
          </CardContent>
        </Card>
        <Card className={`${lowStockItems.length > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
          <CardContent className="p-2 text-center">
            <p className={`text-lg font-bold ${lowStockItems.length > 0 ? 'text-destructive' : 'text-success'}`}>
              {lowStockItems.length}
            </p>
            <p className="text-[9px] text-muted-foreground">Stock bajo</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10">
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-primary">
              {ingredients.filter(i => i.activo).length}
            </p>
            <p className="text-[9px] text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-foreground text-background'
              : 'bg-secondary text-foreground'
          }`}
        >
          <Package className="h-3 w-3" />
          Todos
        </button>
        <button
          onClick={() => setActiveTab('low')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'low'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-secondary text-foreground'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          Stock bajo
          {lowStockItems.length > 0 && (
            <Badge className="ml-1 h-4 text-[9px] bg-white/20">{lowStockItems.length}</Badge>
          )}
        </button>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-foreground">
          {activeTab === 'low' ? 'Ingredientes con stock bajo' : 'Todos los ingredientes'}
        </h2>
        <Button 
          className="bg-primary text-primary-foreground h-7 text-[10px] px-2.5"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      </div>
      
      {/* Ingredients List */}
      <div className="space-y-1.5">
        {displayItems.map((ingredient) => {
  const isCritical = ingredient.stockActual <= ingredient.stockMinimo

const warningThreshold = ingredient.cantidadMaxima * 0.3
const isWarning =
  ingredient.stockActual > ingredient.stockMinimo &&
  ingredient.stockActual <= warningThreshold
  const inUse = isIngredientInUse(ingredient.id)
  const stockPercentage =
  ingredient.cantidadMaxima > 0
    ? (ingredient.stockActual / ingredient.cantidadMaxima) * 100
    : 0

  return (
    <Card
  key={ingredient.id}
  className={`border ${isCritical ? 'border-destructive bg-destructive/5' : ''}`}
>
            
              <CardContent className="p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-medium text-xs text-foreground truncate">
                        {ingredient.nombre}
                      </h4>
                      {isCritical && (
  <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
)}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {ingredient.categoria}
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className={`font-semibold text-xs ${isCritical ? 'text-destructive' : 'text-foreground'}`}>
                      {parseFloat(ingredient.stockActual.toFixed(2))} {ingredient.unidad}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      de {(Number(ingredient.cantidadMaxima ?? 0)).toFixed(2)} {ingredient.unidad}
                    </p>
                  </div>
                </div>
                
                {/* Stock bar */}
                <div className="mt-2 mb-2">
  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
    <div
      className={`h-full transition-all ${
  isCritical
    ? 'bg-destructive'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-green-500'
}`}
      style={{ width: `${Math.min(100, stockPercentage)}%` }}
    />
  </div>
</div>
                
                {/* Actions */}
<div className="flex gap-1">
  <Button
    variant="outline"
    size="sm"
    className="flex-1 h-7 text-[10px] bg-transparent"
    onClick={() => setShowAdjustDialog(ingredient)}
  >
    <Edit2 className="h-2.5 w-2.5 mr-1" />
    Ajustar
  </Button> 

{!inUse && (
  <Button
    variant="destructive"
    size="sm"
    onClick={() => handleDeactivateIngredient(ingredient.id)}
  >
    Eliminar
  </Button>
)}
</div>
              </CardContent>
            </Card>
          )
        })}
        
        {displayItems.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <Package className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                {activeTab === 'low' ? 'No hay ingredientes con stock bajo' : 'No hay ingredientes'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Adjust Stock Dialog */}
      {showAdjustDialog && (
        <AdjustStockDialog
          ingredient={showAdjustDialog}
          onClose={() => setShowAdjustDialog(null)}
          onAdjust={(tipo, cantidad, motivo) => {
            adjustInventory(showAdjustDialog.id, tipo, cantidad, motivo)
            setShowAdjustDialog(null)
          }}
          onUpdateIngredient={updateIngredient}
          onOpenAdvanced={(ingredient) => setShowAdvancedDialog(ingredient)}
        />
      )}
      {showAdvancedDialog && (
  <Dialog open onOpenChange={() => setShowAdvancedDialog(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ajustes avanzados</DialogTitle>
      </DialogHeader>

      <div className="space-y-3 text-xs">
        <div>
          <Label>Stock mínimo</Label>
          <Input
  type="number"
  value={showAdvancedDialog.stockMinimo ?? ''}
  onChange={(e) =>
    setShowAdvancedDialog({
      ...showAdvancedDialog,
      stockMinimo: Number(e.target.value),
    })
  }
/>
        </div>

        <div>
          <Label>Stock máximo</Label>
          <Input
            type="number"
            value={showAdvancedDialog.cantidadMaxima ?? ''}
onChange={(e) =>
  setShowAdvancedDialog({
    ...showAdvancedDialog,
    cantidadMaxima: Number(e.target.value),
  })
}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => setShowAdvancedDialog(null)}
        >
          Cancelar
        </Button>

        <Button
          onClick={() => {
            updateIngredient(showAdvancedDialog.id, {
  stockMinimo:
    showAdvancedDialog.stockMinimo >= 0
      ? showAdvancedDialog.stockMinimo
      : 0,
  cantidadMaxima:
    showAdvancedDialog.cantidadMaxima > 0
      ? showAdvancedDialog.cantidadMaxima
      : 1,
})
setShowAdvancedDialog(null)
          }}
        >
          Guardar
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}
      
      {/* Add Ingredient Dialog */}
      {showAddDialog && (
        <AddIngredientDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={(ingredient) => {
            addIngredient(ingredient)
            setShowAddDialog(false)
          }}
        />
      )}
    </div>
  )
}

interface AdjustStockDialogProps {
  ingredient: Ingredient
  onClose: () => void
  onAdjust: (tipo: 'entrada' | 'salida' | 'merma' | 'ajuste', cantidad: number, motivo: string) => void
  onUpdateIngredient: (id: string, updates: Partial<Ingredient>) => void
  onOpenAdvanced: (ingredient: Ingredient) => void
}

function AdjustStockDialog({
  ingredient,
  onClose,
  onAdjust,
  onUpdateIngredient,
  onOpenAdvanced,
}: AdjustStockDialogProps){
  const { ingredients: allIngredients } = useApp()
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'merma' | 'ajuste'>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [editCategoria, setEditCategoria] = useState<IngredientCategory>(ingredient.categoria)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  // Derive existing categories from all ingredients + defaults
  const existingCategories = [...new Set([
    ...DEFAULT_INGREDIENT_CATEGORIES,
    ...allIngredients.map(i => i.categoria),
  ])].sort()
  
  const handleSubmit = () => {
    const finalCategoria = showNewCategory && newCategoryName.trim() ? newCategoryName.trim() : editCategoria
    // Save category change if it differs
    if (finalCategoria !== ingredient.categoria) {
      onUpdateIngredient(ingredient.id, { categoria: finalCategoria })
    }
    const cantidadNum = Number.parseFloat(cantidad)
    if (cantidadNum > 0 && motivo.trim()) {
      onAdjust(tipo, cantidadNum, motivo)
    } else if (finalCategoria !== ingredient.categoria) {
      // If only category changed, close
      onClose()
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Ajustar: {ingredient.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div>
            <Label className="text-xs">Categoria</Label>
            {showNewCategory ? (
              <div className="flex gap-1">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nueva categoria..."
                  className="h-9 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs bg-transparent shrink-0"
                  onClick={() => { setShowNewCategory(false); setNewCategoryName('') }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Select value={editCategoria} onValueChange={(v) => {
                if (v === '__new__') {
                  setShowNewCategory(true)
                } else {
                  setEditCategoria(v as IngredientCategory)
                }
              }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {existingCategories.map((cat, index) => (
                    <SelectItem key={`${cat}-${index}`} value={cat}>
                    {cat}
                    </SelectItem>
                      ))}
                  <SelectItem value="__new__">+ Crear nueva categoria</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label className="text-xs">Tipo de ajuste</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-success" />
                    Entrada (compra)
                  </span>
                </SelectItem>
                <SelectItem value="salida">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="h-3 w-3 text-amber-500" />
                    Salida (uso)
                  </span>
                </SelectItem>
                <SelectItem value="merma">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    Merma (perdida)
                  </span>
                </SelectItem>
                <SelectItem value="ajuste">
                  <span className="flex items-center gap-1.5">
                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                    Ajuste manual
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs">Cantidad ({ingredient.unidad})</Label>
            <Input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
              className="h-9 text-sm"
            />
            <p className="text-[9px] text-muted-foreground mt-0.5">
              Stock actual: {parseFloat(ingredient.stockActual.toFixed(2))} {ingredient.unidad}
            </p>
          </div>
          
          <div>
            <Label className="text-xs">Motivo</Label>
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo del ajuste..."
              className="h-9 text-sm"
            />
          </div>
          
          <div className="flex justify-between items-center pt-2">
  <Button
  variant="outline"
  className="h-9 text-xs bg-transparent"
  onClick={() => {
  onOpenAdvanced(ingredient)
  onClose()
}}
>
  Ajustes avanzados
</Button>

  <div className="flex gap-2">
    <Button
      variant="outline"
      className="h-9 text-xs bg-transparent"
      onClick={onClose}
    >
      Cancelar
    </Button>
    <Button 
      className="h-9 text-xs bg-primary"
      onClick={handleSubmit}
      disabled={!cantidad && editCategoria === ingredient.categoria}
    >
      Aplicar
    </Button>
  </div>
</div>
        </CardContent>
      </Card>
    </div>
  )
}

interface AddIngredientDialogProps {
  onClose: () => void
  onAdd: (ingredient: Omit<Ingredient, 'id'>) => void
}

function AddIngredientDialog({ onClose, onAdd }: AddIngredientDialogProps) {
  const { ingredients: allIngredients } = useApp()
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('Carnes')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [unidad, setUnidad] = useState('kg')
  const [stockActual, setStockActual] = useState('')
  const [cantidadMaxima, setCantidadMaxima] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [costo, setCosto] = useState('')
  
  // Derive existing categories from all ingredients + defaults
  const existingCategories = [...new Set([
    ...DEFAULT_INGREDIENT_CATEGORIES,
    ...allIngredients.map(i => i.categoria),
  ])].sort()
  
  const handleSubmit = () => {
    const finalCategoria = showNewCategory && newCategoryName.trim() ? newCategoryName.trim() : categoria
    if (nombre.trim() && stockActual && cantidadMaxima && stockMinimo) {
      onAdd({
        nombre: nombre.trim(),
        categoria: finalCategoria as IngredientCategory,
        unidad: unidad as Ingredient['unidad'],
        stockActual: Number.parseFloat(stockActual),
        cantidadMaxima: Number.parseFloat(cantidadMaxima) > 0 ? Number.parseFloat(cantidadMaxima) : 1,
        stockMinimo: Number.parseFloat(stockMinimo) >= 0 ? Number.parseFloat(stockMinimo) : 0,
        costoUnitario: Number.parseFloat(costo) || 0,
        activo: true,
      })
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Agregar ingrediente</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div>
            <Label className="text-xs">Nombre</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del ingrediente"
              className="h-9 text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Categoria</Label>
              {showNewCategory ? (
                <div className="flex gap-1">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nueva categoria..."
                    className="h-9 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs bg-transparent shrink-0"
                    onClick={() => { setShowNewCategory(false); setNewCategoryName('') }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Select value={categoria} onValueChange={(v) => {
                  if (v === '__new__') {
                    setShowNewCategory(true)
                  } else {
                    setCategoria(v)
                  }
                }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCategories.map((cat, index) => (
  <SelectItem key={`${cat}-${index}`} value={cat}>
    {cat}
  </SelectItem>
))}
                    <SelectItem value="__new__">+ Crear nueva categoria</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-xs">Unidad</Label>
              <Select value={unidad} onValueChange={setUnidad}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                  <SelectItem value="g">Gramos (g)</SelectItem>
                  <SelectItem value="lt">Litros (lt)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="pza">Piezas (pza)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Actual</Label>
              <Input
                type="number"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Maximo</Label>
              <Input
                type="number"
                value={cantidadMaxima}
                onChange={(e) => setCantidadMaxima(e.target.value)}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Minimo</Label>
              <Input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Costo unitario (opcional)</Label>
            <Input
              type="number"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              placeholder="0.00"
              className="h-9 text-sm"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 h-9 text-xs bg-transparent" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 h-9 text-xs bg-primary"
              onClick={handleSubmit}
              disabled={!nombre.trim() || !stockActual || !cantidadMaxima || !stockMinimo}
            >
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
