'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, GripVertical, Check, X } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import type { MenuCategory } from '@/lib/store'

// ─── Sortable row ────────────────────────────────────────────────────────────

interface SortableRowProps {
  category: MenuCategory
  itemCount: number
  isEditing: boolean
  editingName: string
  onEditingNameChange: (name: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}

function SortableRow({
  category,
  itemCount,
  isEditing,
  editingName,
  onEditingNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleActive,
  onDelete,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border transition-all ${!category.activa ? 'opacity-60' : ''}`}>
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded touch-none"
              title="Arrastrar para reordenar"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Category name */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editingName}
                    onChange={(e) => onEditingNameChange(e.target.value)}
                    className="h-7 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSaveEdit()
                      if (e.key === 'Escape') onCancelEdit()
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={onSaveEdit} className="h-6 w-6 text-success">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onCancelEdit} className="h-6 w-6">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {category.nombre}
                  </span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1">
                    {itemCount} platillos
                  </Badge>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 mr-2">
                  <Switch
                    checked={category.activa}
                    onCheckedChange={onToggleActive}
                    className="scale-[0.7]"
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {category.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onStartEdit}
                  className="h-6 w-6"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  disabled={itemCount > 0}
                  title={itemCount > 0 ? 'No se puede eliminar categoría con platillos' : ''}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CategoryManager() {
  const { categories, menuItems, addCategory, updateCategory, deleteCategory, reorderCategories } = useApp()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.activa !== b.activa) return a.activa ? -1 : 1
    return a.orden - b.orden
  })

  // Pointer + Touch sensors so it works on both desktop and tablet
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedCategories.findIndex(c => c.id === active.id)
    const newIndex = sortedCategories.findIndex(c => c.id === over.id)

    const reordered = arrayMove(sortedCategories, oldIndex, newIndex)
    reorderCategories(reordered.map(c => c.id))
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    addCategory(newCategoryName.trim())
    setNewCategoryName('')
  }

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateCategory(editingId, { nombre: editingName.trim() })
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory(categoryId)
    setDeleteConfirm(null)
  }

  const getCategoryItemCount = (categoryId: string) =>
    menuItems.filter(item => item.categoria === categoryId).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Categorias del Menu</h3>
          <p className="text-xs text-muted-foreground">
            Arrastrá para reordenar · Activá o desactivá categorías
          </p>
        </div>
      </div>

      {/* Add new category */}
      <div className="flex gap-2">
        <Input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nueva categoria..."
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
        />
        <Button
          onClick={handleAddCategory}
          disabled={!newCategoryName.trim()}
          className="h-8 px-3 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Sortable categories list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sortedCategories.map((category) => (
              <SortableRow
                key={category.id}
                category={category}
                itemCount={getCategoryItemCount(category.id)}
                isEditing={editingId === category.id}
                editingName={editingName}
                onEditingNameChange={setEditingName}
                onStartEdit={() => { setEditingId(category.id); setEditingName(category.nombre) }}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onToggleActive={() => updateCategory(category.id, { activa: !category.activa })}
                onDelete={() => setDeleteConfirm(category.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sortedCategories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No hay categorias. Agrega una para comenzar.
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
            <AlertDialogDescription>
              La categoría será eliminada permanentemente. Los platillos que usaban esta categoría pasarán a "Sin categoría".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteCategory(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
