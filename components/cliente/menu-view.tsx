'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, ShoppingBag, ChevronLeft, Plus, AlertCircle } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice, type MenuItem, canPrepareItem, ETIQUETAS_CONFIG } from '@/lib/store'

interface MenuViewProps {
  mesa: number
  onSelectItem: (item: MenuItem) => void
  onGoToCart: () => void
  cartItemCount: number
  hasActiveOrders: boolean
  onViewStatus: () => void
  onExit: () => void
  canOrder?: boolean
}

export function MenuView({
  mesa,
  onSelectItem,
  onGoToCart,
  cartItemCount,
  hasActiveOrders,
  onViewStatus,
  onExit,
  canOrder = true,
}: MenuViewProps) {
  const { menuItems, ingredients, categories, getActivePromociones } = useApp()
  const activePromociones = getActivePromociones()
  const activeCategories = [...categories]
    .filter(c => c.activa)
    .sort((a, b) => a.orden - b.orden)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Filter items but keep unavailable ones visible
  const filteredItems = menuItems.filter((item) => {
    if (search && !item.nombre.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedCategory && item.categoria !== selectedCategory) return false
    return true
  })

  // Group items by category when no category is selected
  const itemsByCategory = selectedCategory
    ? { [selectedCategory]: filteredItems }
    : activeCategories.reduce((acc, cat) => {
        const items = filteredItems.filter(item => item.categoria === cat.id)
        if (items.length > 0) acc[cat.id] = items
        return acc
      }, {} as Record<string, MenuItem[]>)

  const getItemAvailability = (item: MenuItem) => {
    if (!item.disponible) {
      return { canPrepare: false, maxPortions: 0 }
    }
    return canPrepareItem(item, ingredients)
  }

  const getCategoryEmoji = (categoriaId: string) => {
    const nombre = categories.find(c => c.id === categoriaId)?.nombre ?? ''
    switch (nombre) {
      case 'Tacos': return '🌮'
      case 'Antojitos': return '🫓'
      case 'Bebidas': return '🥤'
      case 'Postres': return '🍮'
      default: return '🍽️'
    }
  }
  
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white">
        <div className="px-4 pt-3 pb-2">
          {/* Top bar with back, logo, and cart */}
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={onExit}
              className="w-8 h-8 flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            
            <div className="flex items-center gap-1.5">
              <Image src="/logo.png" alt="Pa' Que Vos Veais" width={24} height={24} className="w-6 h-6 object-contain" priority />
              <span className="text-xs font-medium text-muted-foreground">Mesa {mesa}</span>
            </div>
            
            <button 
              onClick={onGoToCart}
              className="w-8 h-8 flex items-center justify-center relative"
              disabled={!canOrder}
            >
              <ShoppingBag className={`h-5 w-5 ${canOrder ? 'text-foreground' : 'text-muted-foreground'}`} />
              {cartItemCount > 0 && canOrder && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Payment requested banner */}
          {!canOrder && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-[11px] text-amber-700">
                Pago en proceso. No puedes agregar más platillos.
              </p>
            </div>
          )}

          {/* Categories */}
          <div className="mb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                  selectedCategory === null
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-foreground'
                }`}
              >
                Todo
              </button>
              {activeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-foreground text-background'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar platillo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-secondary border-0 rounded-xl w-full"
            />
          </div>
        </div>
      </header>

      {/* Promotions Banner */}
      {activePromociones.length > 0 && (
        <div className="px-4 pt-2 pb-1 flex gap-2 overflow-x-auto scrollbar-none">
          {activePromociones.map(promo => (
            <div
              key={promo.id}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
                promo.color === 'green' ? 'bg-green-50 border-green-200 text-green-700' :
                promo.color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                promo.color === 'red' ? 'bg-red-50 border-red-200 text-red-700' :
                promo.color === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                'bg-orange-50 border-orange-200 text-orange-700'
              }`}
            >
              <span>🏷️</span>
              <div>
                <p className="font-semibold leading-none">{promo.titulo}</p>
                {promo.descripcion && <p className="opacity-80 mt-0.5 leading-none">{promo.descripcion}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Menu Items */}
      <main className="flex-1 px-4 pb-4">
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <span>{getCategoryEmoji(category)}</span>
              {categories.find(c => c.id === category)?.nombre ?? category}
            </h2>
            <div className="space-y-0 divide-y divide-border">
              {items.map((item) => {
                const availability = getItemAvailability(item)
                const isAvailable = availability.canPrepare
                const showLowStock = isAvailable && availability.maxPortions <= 5 && availability.maxPortions > 0

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 py-3 ${
                      isAvailable && canOrder ? 'cursor-pointer active:bg-secondary/50' : 'opacity-50'
                    }`}
                    onClick={() => isAvailable && canOrder && onSelectItem(item)}
                  >
                    {/* Image */}
                    <div className={`w-20 h-20 bg-secondary rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center relative ${
                      !isAvailable ? 'grayscale' : ''
                    }`}>
                      {item.imagen ? (
                        <Image
                          src={item.imagen}
                          alt={item.nombre}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{getCategoryEmoji(item.categoria)}</span>
                      )}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-destructive">AGOTADO</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-foreground leading-tight">
                          {item.nombre}
                        </h3>
                        {showLowStock && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            Últimos {availability.maxPortions}
                          </span>
                        )}
                      </div>
                      {item.descripcion && (
                        <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {item.descripcion}
                        </p>
                      )}
                      {item.etiquetas && item.etiquetas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.etiquetas.map(tag => {
                            const cfg = ETIQUETAS_CONFIG[tag]
                            return cfg ? (
                              <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                {cfg.emoji} {cfg.label}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-bold text-foreground">
                          {formatPrice(item.precio)}
                        </p>
                        {isAvailable && canOrder && (
                          <button
                            className="w-8 h-8 flex items-center justify-center bg-foreground text-background rounded-full active:scale-95 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectItem(item)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No se encontraron platillos</p>
          </div>
        )}
      </main>

      {/* Floating cart button when items in cart */}
      {cartItemCount > 0 && canOrder && (
        <div className="fixed bottom-[4.5rem] left-4 right-4 max-w-md mx-auto z-40">
          <button
            onClick={onGoToCart}
            className="w-full bg-foreground text-background h-12 rounded-2xl flex items-center justify-between px-5 shadow-lg text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            <span className="bg-white/20 text-background text-xs font-bold px-2 py-0.5 rounded-full">
              {cartItemCount}
            </span>
            <span>Ver pedido</span>
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
