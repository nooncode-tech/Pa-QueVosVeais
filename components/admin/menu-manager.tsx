'use client'

import { useState } from 'react'
import { Plus, Edit2, ImageIcon, FolderOpen, GripVertical } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { formatPrice, type MenuItem } from '@/lib/store'
import { MenuItemDialog } from './menu-item-dialog'
import { CategoryManager } from './category-manager'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Sortable menu item card ──────────────────────────────────────────────────
function SortableMenuItemCard({
  item,
  onEdit,
  onToggle,
}: {
  item: MenuItem
  onEdit: () => void
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border transition-opacity ${!item.disponible ? 'opacity-50' : ''}`}>
        <CardContent className="p-2">
          <div className="flex items-start gap-2">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded touch-none self-center shrink-0"
              title="Arrastrar para reordenar"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Image */}
            <div className="w-10 h-10 bg-secondary rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
              {item.imagen ? (
                <img
                  src={item.imagen || "/placeholder.svg"}
                  alt={item.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-xs text-foreground leading-tight truncate">
                    {item.nombre}
                  </h4>
                  {item.descripcion && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight mt-0.5">
                      {item.descripcion}
                    </p>
                  )}
                  {item.extras && item.extras.length > 0 && (
                    <Badge variant="secondary" className="text-[8px] h-3 px-1 mt-0.5">
                      {item.extras.length} extras
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-xs text-primary whitespace-nowrap flex-shrink-0">
                  {formatPrice(item.precio)}
                </p>
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-normal">
                    {item.cocina === 'cocina_a' ? 'Cocina A' :
                     item.cocina === 'cocina_b' ? 'Cocina B' : 'Ambas'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={item.disponible}
                      onCheckedChange={onToggle}
                      className="scale-[0.6] origin-left"
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {item.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onEdit} className="h-6 w-6">
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Sortable category section ────────────────────────────────────────────────
function CategorySection({
  categoryId,
  categoryName,
  items,
  onEdit,
  onToggle,
  onReorder,
}: {
  categoryId: string
  categoryName: string
  items: MenuItem[]
  onEdit: (item: MenuItem) => void
  onToggle: (item: MenuItem) => void
  onReorder: (categoryId: string, itemIds: string[]) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const sortedItems = [...items].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sortedItems.findIndex(i => i.id === active.id)
    const newIndex = sortedItems.findIndex(i => i.id === over.id)
    const reordered = arrayMove(sortedItems, oldIndex, newIndex)
    onReorder(categoryId, reordered.map(i => i.id))
  }

  return (
    <div className="mb-4">
      <h3 className="font-medium text-xs text-foreground mb-1.5 flex items-center gap-1">
        {categoryName}
        <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-normal">
          {items.length}
        </Badge>
      </h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {sortedItems.map(item => (
              <SortableMenuItemCard
                key={item.id}
                item={item}
                onEdit={() => onEdit(item)}
                onToggle={() => onToggle(item)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MenuManager() {
  const { menuItems, updateMenuItem, categories, reorderMenuItems } = useApp()
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)

  const handleToggleAvailability = (item: MenuItem) => {
    updateMenuItem(item.id, { disponible: !item.disponible })
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setShowDialog(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingItem(null)
  }

  const sortedCategories = [...categories]
    .filter(c => c.activa)
    .sort((a, b) => a.orden - b.orden)

  const uncategorizedItems = menuItems.filter(
    item => !sortedCategories.some(c => c.id === item.categoria)
  )

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-foreground">Gestion de menu</h2>
          <p className="text-[10px] text-muted-foreground">
            {menuItems.length} platillos · arrastrá para reordenar
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            className="h-7 text-[10px] px-2.5 bg-transparent"
            onClick={() => setShowCategoryManager(true)}
          >
            <FolderOpen className="h-3 w-3 mr-1" />
            Categorias
          </Button>
          <Button
            className="bg-primary text-primary-foreground h-7 text-[10px] px-2.5"
            onClick={handleAdd}
          >
            <Plus className="h-3 w-3 mr-1" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Category Manager Dialog */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Administrar Categorias
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6 py-2">
            <CategoryManager />
          </div>
          <div className="shrink-0 pt-3 border-t border-border">
            <Button
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => setShowCategoryManager(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Items grouped by category with DnD */}
      <div>
        {sortedCategories.map(categoria => {
          const categoryItems = menuItems.filter(item => item.categoria === categoria.id)
          if (categoryItems.length === 0) return null
          return (
            <CategorySection
              key={categoria.id}
              categoryId={categoria.id}
              categoryName={categoria.nombre}
              items={categoryItems}
              onEdit={handleEdit}
              onToggle={handleToggleAvailability}
              onReorder={reorderMenuItems}
            />
          )
        })}

        {/* Items without category */}
        {uncategorizedItems.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-xs text-foreground mb-1.5 flex items-center gap-1">
              Sin categoria
              <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-normal">
                {uncategorizedItems.length}
              </Badge>
            </h3>
            <div className="space-y-1.5">
              {uncategorizedItems.map(item => (
                <Card
                  key={item.id}
                  className={`border transition-opacity ${!item.disponible ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-2">
                    <div className="flex items-start gap-2">
                      <div className="w-10 h-10 bg-secondary rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.imagen ? (
                          <img src={item.imagen || "/placeholder.svg"} alt={item.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-medium text-xs text-foreground leading-tight truncate">{item.nombre}</h4>
                          <p className="font-semibold text-xs text-primary whitespace-nowrap flex-shrink-0">{formatPrice(item.precio)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1">
                            <Switch checked={item.disponible} onCheckedChange={() => handleToggleAvailability(item)} className="scale-[0.6] origin-left" />
                            <span className="text-[9px] text-muted-foreground">{item.disponible ? 'Disponible' : 'No disponible'}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-6 w-6">
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {showDialog && (
        <MenuItemDialog
          item={editingItem}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  )
}
