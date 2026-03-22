import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  getStatusLabel,
  getPaymentMethodLabel,
  calculateOrderTotal,
  canPrepareItem,
} from '../lib/store'
import type { MenuItem, Ingredient, OrderItem } from '../lib/store'

// ─── formatPrice ────────────────────────────────────────────────────────────
describe('formatPrice', () => {
  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('formats whole numbers with two decimals', () => {
    expect(formatPrice(100)).toBe('$100.00')
  })

  it('formats decimals correctly', () => {
    expect(formatPrice(49.9)).toBe('$49.90')
    expect(formatPrice(1.999)).toBe('$2.00') // toFixed rounding
  })

  it('handles negative values', () => {
    expect(formatPrice(-10)).toBe('$-10.00')
  })
})

// ─── getStatusLabel ──────────────────────────────────────────────────────────
describe('getStatusLabel', () => {
  it('maps every status to a Spanish label', () => {
    expect(getStatusLabel('recibido')).toBe('Recibido')
    expect(getStatusLabel('preparando')).toBe('Preparando')
    expect(getStatusLabel('listo')).toBe('Listo')
    expect(getStatusLabel('entregado')).toBe('Entregado')
    expect(getStatusLabel('cancelado')).toBe('Cancelado')
    expect(getStatusLabel('empacado')).toBe('Empacado')
    expect(getStatusLabel('en_camino')).toBe('En camino')
  })
})

// ─── getPaymentMethodLabel ───────────────────────────────────────────────────
describe('getPaymentMethodLabel', () => {
  it('maps all payment methods', () => {
    expect(getPaymentMethodLabel('efectivo')).toBe('Efectivo')
    expect(getPaymentMethodLabel('tarjeta')).toBe('Tarjeta')
    expect(getPaymentMethodLabel('transferencia')).toBe('Transferencia')
    expect(getPaymentMethodLabel('apple_pay')).toBe('Apple Pay')
  })
})

// ─── calculateOrderTotal ─────────────────────────────────────────────────────
describe('calculateOrderTotal', () => {
  it('returns 0 for an empty order', () => {
    expect(calculateOrderTotal([])).toBe(0)
  })

  it('calculates simple items correctly', () => {
    const items: OrderItem[] = [
      {
        id: '1',
        menuItem: { id: 'm1', nombre: 'Taco', precio: 30 } as MenuItem,
        cantidad: 2,
      },
    ]
    expect(calculateOrderTotal(items)).toBe(60)
  })

  it('adds extras to the total', () => {
    const items: OrderItem[] = [
      {
        id: '1',
        menuItem: { id: 'm1', nombre: 'Taco', precio: 30 } as MenuItem,
        cantidad: 1,
        extras: [
          { id: 'e1', nombre: 'Guacamole', precio: 10 },
          { id: 'e2', nombre: 'Queso', precio: 5 },
        ],
      },
    ]
    // (30 + 10 + 5) * 1 = 45
    expect(calculateOrderTotal(items)).toBe(45)
  })

  it('accumulates multiple items with extras', () => {
    const items: OrderItem[] = [
      {
        id: '1',
        menuItem: { id: 'm1', nombre: 'Taco', precio: 30 } as MenuItem,
        cantidad: 3,
        extras: [{ id: 'e1', nombre: 'Guacamole', precio: 10 }],
      },
      {
        id: '2',
        menuItem: { id: 'm2', nombre: 'Agua', precio: 20 } as MenuItem,
        cantidad: 2,
      },
    ]
    // (30+10)*3 + 20*2 = 120 + 40 = 160
    expect(calculateOrderTotal(items)).toBe(160)
  })
})

// ─── canPrepareItem ──────────────────────────────────────────────────────────
describe('canPrepareItem', () => {
  const makeItem = (receta: MenuItem['receta']): MenuItem =>
    ({ id: 'i1', nombre: 'Test', precio: 50, receta } as MenuItem)

  const makeIngredient = (id: string, stock: number): Ingredient =>
    ({ id, nombre: 'Ing', stockActual: stock, unidad: 'g', stockMinimo: 0 } as Ingredient)

  it('returns canPrepare=true with 999 portions when item has no recipe', () => {
    const result = canPrepareItem(makeItem([]), [])
    expect(result).toEqual({ canPrepare: true, maxPortions: 999 })
  })

  it('returns canPrepare=false when a required ingredient is missing', () => {
    const item = makeItem([{ ingredientId: 'ing-missing', cantidad: 10 }])
    const result = canPrepareItem(item, [])
    expect(result).toEqual({ canPrepare: false, maxPortions: 0 })
  })

  it('calculates portions based on available stock', () => {
    const item = makeItem([{ ingredientId: 'flour', cantidad: 100 }])
    const ingredients = [makeIngredient('flour', 250)]
    // floor(250 / 100) = 2
    const result = canPrepareItem(item, ingredients)
    expect(result).toEqual({ canPrepare: true, maxPortions: 2 })
  })

  it('uses the limiting ingredient when multiple ingredients', () => {
    const item = makeItem([
      { ingredientId: 'flour', cantidad: 100 },
      { ingredientId: 'salt', cantidad: 5 },
    ])
    const ingredients = [
      makeIngredient('flour', 500), // 5 portions
      makeIngredient('salt', 10),   // 2 portions — limiting
    ]
    const result = canPrepareItem(item, ingredients)
    expect(result).toEqual({ canPrepare: true, maxPortions: 2 })
  })

  it('returns canPrepare=false when stock is zero', () => {
    const item = makeItem([{ ingredientId: 'flour', cantidad: 100 }])
    const ingredients = [makeIngredient('flour', 0)]
    expect(canPrepareItem(item, ingredients).canPrepare).toBe(false)
  })

  it('returns canPrepare=false when stock is insufficient for one portion', () => {
    const item = makeItem([{ ingredientId: 'flour', cantidad: 100 }])
    const ingredients = [makeIngredient('flour', 50)]
    expect(canPrepareItem(item, ingredients).canPrepare).toBe(false)
    expect(canPrepareItem(item, ingredients).maxPortions).toBe(0)
  })
})
