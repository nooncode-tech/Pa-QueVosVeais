'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import {
  type Order,
  type OrderItem,
  type TableSession,
  type MenuItem,
  type Channel,
  type OrderStatus,
  type KitchenStatus,
  type User,
  type UserRole,
  type Ingredient,
  type WaiterCall,
  type Reward,
  type AppliedReward,
  type AppConfig,
  type AuditLog,
  type PaymentMethod,
  type PaymentStatus,
  type BillStatus,
  type InventoryAdjustment,
  type QRToken,
  type Refund,
  type CancelReason,
  type DeliveryZone,
  type MenuCategory,
  type Extra,
  type TableConfig,
  MENU_ITEMS,
  DEFAULT_INGREDIENTS,
  DEFAULT_USERS,
  DEFAULT_REWARDS,
  DEFAULT_CONFIG,
  DEFAULT_DELIVERY_ZONES,
  DEFAULT_CATEGORIES,
  DEFAULT_TABLES,
  generateId,
  generateOrderNumber,
  generateDeviceId,
  calculateOrderTotal,
  deductIngredients,
  restoreIngredients,
  canPrepareItem,
  createQRToken,
  validateQRToken,
  getDeliveryZoneCost,
} from './store'

interface AppState {
  orders: Order[]
  tableSessions: TableSession[]
  menuItems: MenuItem[]
  ingredients: Ingredient[]
  users: User[]
  rewards: Reward[]
  appliedRewards: AppliedReward[]
  waiterCalls: WaiterCall[]
  config: AppConfig
  auditLogs: AuditLog[]
  inventoryAdjustments: InventoryAdjustment[]
  qrTokens: QRToken[]
  refunds: Refund[]
  deliveryZones: DeliveryZone[]
  categories: MenuCategory[]
  tables: TableConfig[]
  cart: OrderItem[]
  currentTable: number | null
  currentUser: User | null
  currentSessionId: string | null
}

interface AppContextType extends AppState {
  // Auth actions
  login: (username: string, password: string) => User | null
  logout: () => void
  
  // Cart actions
  addToCart: (item: MenuItem, cantidad: number, notas?: string, extras?: MenuItem['extras']) => void
  removeFromCart: (itemId: string) => void
  updateCartItem: (itemId: string, cantidad: number) => void
  clearCart: () => void
  
  // Order actions
  createOrder: (canal: Channel, mesa?: number, clienteInfo?: { nombre?: string; telefono?: string; direccion?: string; zonaReparto?: string; costoEnvio?: number }) => Order | null
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  updateKitchenStatus: (orderId: string, kitchen: 'a' | 'b', status: KitchenStatus) => void
  cancelOrder: (orderId: string, reason: CancelReason, motivo?: string, userId?: string) => boolean
  updateOrderItems: (orderId: string, items: OrderItem[]) => boolean
  markOrderDelivered: (orderId: string, meseroId?: string) => void
  
  // Table Session actions
  setCurrentTable: (mesa: number | null) => void
  getTableSession: (mesa: number) => TableSession | undefined
  createTableSession: (mesa: number) => TableSession
  closeTableSession: (sessionId: string) => void
  isSessionValid: (mesa: number) => boolean
  
  // Bill/Payment ACTIONS
  updateBillTotals: (sessionId: string) => void
  applyDiscount: (sessionId: string, descuento: number, motivo: string) => void
  setTipAmount: (sessionId: string, propina: number) => void
  requestPayment: (sessionId: string, method: PaymentMethod) => void
  confirmPayment: (sessionId: string) => void
  getSessionBill: (sessionId: string) => TableSession | undefined
  
  // Waiter Call actions
  createWaiterCall: (mesa: number, tipo: 'atencion' | 'cuenta' | 'otro', mensaje?: string) => void
  markCallAttended: (callId: string, userId: string) => void
  getPendingCalls: () => WaiterCall[]
  
  // Reward actions
  applyReward: (sessionId: string, rewardId: string) => boolean
  getAvailableRewards: (sessionId: string) => Reward[]
  
  // Menu actions
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void
  deleteMenuItem: (itemId: string) => void
  getAvailableMenuItems: () => MenuItem[]
  
  // Category actions
  categories: MenuCategory[]
  addCategory: (nombre: string) => void
  updateCategory: (categoryId: string, updates: Partial<MenuCategory>) => void
  deleteCategory: (categoryId: string) => void
  reorderCategories: (categoryIds: string[]) => void
  
  // Table actions
  tables: TableConfig[]
  addTable: (numero: number, capacidad?: number, ubicacion?: string) => void
  updateTable: (tableId: string, updates: Partial<TableConfig>) => void
  deleteTable: (tableId: string) => void
  getActiveTables: () => TableConfig[]
  
  // Inventory actions
  updateIngredient: (ingredientId: string, updates: Partial<Ingredient>) => void
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void
  adjustInventory: (ingredientId: string, tipo: 'entrada' | 'salida' | 'merma' | 'ajuste', cantidad: number, motivo: string) => void
  getLowStockIngredients: () => Ingredient[]
  
  // User management
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void
  updateUser: (userId: string, updates: Partial<User>) => void
  deleteUser: (userId: string) => void
  
  // Config
  updateConfig: (updates: Partial<AppConfig>) => void
  
  // Audit
  logAction: (accion: string, detalles: string, entidad: string, entidadId: string) => void
  
  // QR Token actions
  generateTableQR: (mesa: number) => QRToken
  validateTableQR: (token: string) => { valid: boolean; mesa?: number; token?: QRToken }
  invalidateTableQR: (tokenId: string) => void
  getActiveQRForTable: (mesa: number) => QRToken | undefined
  
  // Refund actions
  createRefund: (orderId: string, monto: number, motivo: string, tipo: 'total' | 'parcial', itemIds?: string[], userId?: string) => Refund | null
  getOrderRefunds: (orderId: string) => Refund[]
  
  // Delivery zone actions
  getDeliveryZones: () => DeliveryZone[]
  updateDeliveryZone: (zonaNombre: string, updates: Partial<DeliveryZone>) => void
  addDeliveryZone: (zone: DeliveryZone) => void
  calculateDeliveryCost: (zonaNombre: string) => number
  
  // Payment utility actions
  resetSessionPaymentStatus: (sessionId: string) => void
  markFeedbackDone: (sessionId: string) => void
  
  // Emergency actions
  emergencyCloseAllTables: () => void
  
  // Utility
  getOrdersForKitchen: (kitchen: 'a' | 'b') => Order[]
  getPendingDeliveries: () => Order[]
  getTableOrders: (mesa: number) => Order[]
  getAllActiveOrders: () => Order[]
  getPaymentsForDate: (date: Date) => TableSession[]
  canEditOrder: (orderId: string) => boolean
  canCancelOrder: (orderId: string) => boolean
}

const AppContext = createContext<AppContextType | null>(null)

const STORAGE_KEY = 'pqvv_app_state_v2'

function loadState(): AppState {
  if (typeof window === 'undefined') {
    return getDefaultState()
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const result: AppState = {
        orders: parsed.orders?.map((o: Order) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
          tiempoInicioPreparacion: o.tiempoInicioPreparacion ? new Date(o.tiempoInicioPreparacion) : undefined,
          tiempoFinPreparacion: o.tiempoFinPreparacion ? new Date(o.tiempoFinPreparacion) : undefined,
        })) || [],
        tableSessions: parsed.tableSessions?.map((s: TableSession) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          expiresAt: new Date(s.expiresAt),
          paidAt: s.paidAt ? new Date(s.paidAt) : undefined,
        })) || [],
        menuItems: parsed.menuItems || MENU_ITEMS,
        ingredients: parsed.ingredients || DEFAULT_INGREDIENTS,
        users: (parsed.users && parsed.users.length > 0) 
          ? parsed.users.map((u: User) => ({
              ...u,
              createdAt: new Date(u.createdAt),
            }))
          : DEFAULT_USERS,
        rewards: parsed.rewards || DEFAULT_REWARDS,
        appliedRewards: parsed.appliedRewards || [],
        waiterCalls: parsed.waiterCalls?.map((c: WaiterCall) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          atendidoAt: c.atendidoAt ? new Date(c.atendidoAt) : undefined,
        })) || [],
        config: parsed.config || DEFAULT_CONFIG,
        auditLogs: parsed.auditLogs?.map((l: AuditLog) => ({
          ...l,
          createdAt: new Date(l.createdAt),
        })) || [],
        inventoryAdjustments: parsed.inventoryAdjustments?.map((a: InventoryAdjustment) => ({
          ...a,
          createdAt: new Date(a.createdAt),
        })) || [],
        qrTokens: parsed.qrTokens?.map((t: QRToken) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          expiresAt: new Date(t.expiresAt),
          usedAt: t.usedAt ? new Date(t.usedAt) : undefined,
        })) || [],
        refunds: parsed.refunds?.map((r: Refund) => ({
          ...r,
          createdAt: new Date(r.createdAt),
        })) || [],
        deliveryZones: parsed.deliveryZones || DEFAULT_DELIVERY_ZONES,
        categories: parsed.categories || DEFAULT_CATEGORIES,
        tables: parsed.tables?.map((t: TableConfig) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        })) || DEFAULT_TABLES,
        cart: parsed.cart || [],
        currentTable: parsed.currentTable ?? null,
        currentUser: parsed.currentUser || null,
        currentSessionId: parsed.currentSessionId || null,
      }

      // Validate: clear currentTable/currentSessionId if there is no matching active session
      const sessions: TableSession[] = result.tableSessions
      if (result.currentSessionId) {
        const sessionExists = sessions.some(s => s.id === result.currentSessionId && s.activa)
        if (!sessionExists) {
          result.currentSessionId = null
          result.currentTable = null
          result.cart = []
        }
      } else if (result.currentTable !== null) {
        const hasActiveSession = sessions.some(s => s.mesa === result.currentTable && s.activa)
        if (!hasActiveSession) {
          result.currentTable = null
          result.cart = []
        }
      }

      return result
    }
  } catch (e) {
    console.error('Error loading state:', e)
  }
  
  return getDefaultState()
}

function getDefaultState(): AppState {
  return {
    orders: [],
    tableSessions: [],
    menuItems: MENU_ITEMS,
    ingredients: DEFAULT_INGREDIENTS,
    users: DEFAULT_USERS,
    rewards: DEFAULT_REWARDS,
    appliedRewards: [],
    waiterCalls: [],
    config: DEFAULT_CONFIG,
    auditLogs: [],
    inventoryAdjustments: [],
    qrTokens: [],
    refunds: [],
    deliveryZones: DEFAULT_DELIVERY_ZONES,
    categories: DEFAULT_CATEGORIES,
    tables: DEFAULT_TABLES,
    cart: [],
    currentTable: null,
    currentUser: null,
    currentSessionId: null,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(getDefaultState)
  const [isHydrated, setIsHydrated] = useState(false)
  const isWritingRef = useRef(false)
  
  // Load state from localStorage on mount (client-side only)
  useEffect(() => {
    const loaded = loadState()
    setState(loaded)
    setIsHydrated(true)
  }, [])
  
  // Save state to localStorage after hydration
  useEffect(() => {
    if (isHydrated) {
      isWritingRef.current = true
      const stateToSave = {
  ...state,
  menuItems: state.menuItems.map(item => ({
    ...item,
    imagen: undefined
  }))
}

localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      // Reset flag after a tick to allow storage event from other tabs
      setTimeout(() => {
        isWritingRef.current = false
      }, 0)
    }
  }, [state, isHydrated])
  
  // Listen for changes from other tabs only
  useEffect(() => {
    if (!isHydrated) return
    
    const handleStorageChange = (e: StorageEvent) => {
      // Skip if we triggered this change ourselves
      if (isWritingRef.current) return
      if (e.key !== STORAGE_KEY || !e.newValue) return
      
      try {
        const newState = JSON.parse(e.newValue)
        setState(prev => ({
          ...prev,
          orders: newState.orders?.map((o: Order) => ({
            ...o,
            createdAt: new Date(o.createdAt),
            updatedAt: new Date(o.updatedAt),
          })) || prev.orders,
          tableSessions: newState.tableSessions?.map((s: TableSession) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            expiresAt: new Date(s.expiresAt),
          })) || prev.tableSessions,
          waiterCalls: newState.waiterCalls?.map((c: WaiterCall) => ({
            ...c,
            createdAt: new Date(c.createdAt),
          })) || prev.waiterCalls,
          menuItems: newState.menuItems || prev.menuItems,
          ingredients: newState.ingredients || prev.ingredients,
        }))
      } catch (err) {
        console.error('Error syncing state:', err)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isHydrated])
  
  // ============ AUTH ACTIONS ============
  const login = useCallback((username: string, password: string): User | null => {
    const user = state.users.find(u => u.username === username && u.password === password && u.activo)
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }))
      return user
    }
    return null
  }, [state.users])
  
  const logout = useCallback(() => {
    setState(prev => ({ ...prev, currentUser: null, currentTable: null, currentSessionId: null, cart: [] }))
  }, [])
  
  // ============ CART ACTIONS ============
  const addToCart = useCallback((item: MenuItem, cantidad: number, notas?: string, extras?: MenuItem['extras']) => {
    setState(prev => {
      const existingIndex = prev.cart.findIndex(
        ci => ci.menuItem.id === item.id && ci.notas === notas && JSON.stringify(ci.extras) === JSON.stringify(extras)
      )
      
      if (existingIndex >= 0) {
        const newCart = [...prev.cart]
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          cantidad: newCart[existingIndex].cantidad + cantidad,
        }
        return { ...prev, cart: newCart }
      }
      
      return {
        ...prev,
        cart: [
          ...prev.cart,
          {
            id: generateId(),
            menuItem: item,
            cantidad,
            notas,
            extras,
          },
        ],
      }
    })
  }, [])
  
  const removeFromCart = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.filter(item => item.id !== itemId),
    }))
  }, [])
  
  const updateCartItem = useCallback((itemId: string, cantidad: number) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(item =>
        item.id === itemId ? { ...item, cantidad } : item
      ),
    }))
  }, [])
  
  const clearCart = useCallback(() => {
    setState(prev => ({ ...prev, cart: [] }))
  }, [])
  
  // ============ ORDER ACTIONS ============
  const createOrder = useCallback((
    canal: Channel,
    mesa?: number,
    clienteInfo?: { nombre?: string; telefono?: string; direccion?: string; zonaReparto?: string; costoEnvio?: number }
  ): Order | null => {
    if (state.cart.length === 0) return null
    
    // Check inventory and deduct ingredients
    let newIngredients = [...state.ingredients]
    for (const cartItem of state.cart) {
      const { canPrepare } = canPrepareItem(cartItem.menuItem, newIngredients)
      if (!canPrepare) {
        return null // Cannot create order if ingredients not available
      }
      newIngredients = deductIngredients(cartItem.menuItem, cartItem.cantidad, newIngredients, cartItem.extras)
    }
    
    // For table orders, number relative to session; for others, use global counter
    let orderNumero: number
    if (mesa) {
      const session = state.tableSessions.find(s => s.mesa === mesa && s.activa)
      orderNumero = (session?.orders?.length || 0) + 1
    } else {
      orderNumero = generateOrderNumber()
    }

    const order: Order = {
      id: generateId(),
      numero: orderNumero,
      canal,
      mesa,
      items: state.cart.map(item => ({
        ...item,
        cocinaAStatus: (item.menuItem.cocina === 'cocina_a' || item.menuItem.cocina === 'ambas') ? 'en_cola' : undefined,
        cocinaBStatus: (item.menuItem.cocina === 'cocina_b' || item.menuItem.cocina === 'ambas') ? 'en_cola' : undefined,
      })),
      status: 'recibido',
      cocinaAStatus: 'en_cola',
      cocinaBStatus: 'en_cola',
      createdAt: new Date(),
      updatedAt: new Date(),
      nombreCliente: clienteInfo?.nombre,
      telefono: clienteInfo?.telefono,
      direccion: clienteInfo?.direccion,
      zonaReparto: clienteInfo?.zonaReparto,
    }
    
    setState(prev => {
      // Update table session if applicable
      let tableSessions = prev.tableSessions
      if (mesa) {
        const sessionIndex = tableSessions.findIndex(s => s.mesa === mesa && s.activa)
        if (sessionIndex >= 0) {
  const session = tableSessions[sessionIndex]

  const newOrders = [...session.orders, order]
  const subtotal = newOrders.reduce(
    (sum, o) => sum + calculateOrderTotal(o.items),
    0
  )
  const impuestos = subtotal * (prev.config.impuestoPorcentaje / 100)

  tableSessions = [...tableSessions]
  tableSessions[sessionIndex] = {
    ...session,
    orders: newOrders,
    subtotal,
    impuestos,
    total: subtotal + impuestos + session.propina - session.descuento,

    // 🔥 ESTO ES LO QUE ARREGLA TODO
    billStatus: 'abierta',
    paymentStatus: 'pendiente',
    paidAt: undefined,
    receiptId: undefined,
  }
}
 else {
          // Create new session
          const subtotal = calculateOrderTotal(order.items)
          const impuestos = subtotal * (prev.config.impuestoPorcentaje / 100)
          
          tableSessions = [
            ...tableSessions,
            {
              id: generateId(),
              mesa,
              activa: true,
              orders: [order],
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + prev.config.tiempoExpiracionSesionMinutos * 60 * 1000),
              deviceId: generateDeviceId(),
              billStatus: 'abierta',
              subtotal,
              impuestos,
              propina: 0,
              descuento: 0,
              total: subtotal + impuestos,
              paymentStatus: 'pendiente',
            },
          ]
        }
      }
      
      // Update menu item availability based on new inventory
      const menuItems = prev.menuItems.map(item => {
        const { canPrepare } = canPrepareItem(item, newIngredients)
        return { ...item, disponible: canPrepare }
      })
      
      return {
        ...prev,
        orders: [...prev.orders, order],
        tableSessions,
        ingredients: newIngredients,
        menuItems,
        cart: [],
      }
    })
    
    return order
  }, [state.cart, state.ingredients, state.config.impuestoPorcentaje, state.config.tiempoExpiracionSesionMinutos])
  
  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setState(prev => {
      const updatedOrders = prev.orders.map(order => {
        if (order.id !== orderId) return order
        
        const updates: Partial<Order> = { status, updatedAt: new Date() }
        
        if (status === 'preparando' && !order.tiempoInicioPreparacion) {
          updates.tiempoInicioPreparacion = new Date()
        }
        if ((status === 'listo' || status === 'entregado') && !order.tiempoFinPreparacion) {
          updates.tiempoFinPreparacion = new Date()
        }
        
        return { ...order, ...updates }
      })

      // 🔥 SYNC session.orders with updated orders
      const updatedSessions = prev.tableSessions.map(session => ({
        ...session,
        orders: session.orders.map(o => updatedOrders.find(uo => uo.id === o.id) || o),
      }))
      
      return {
        ...prev,
        orders: updatedOrders,
        tableSessions: updatedSessions,
      }
    })
  }, [])
  
  const updateKitchenStatus = useCallback((orderId: string, kitchen: 'a' | 'b', status: KitchenStatus) => {
    setState(prev => {
      const updatedOrders = prev.orders.map(order => {
        if (order.id !== orderId) return order
        
        const updates: Partial<Order> = {
          updatedAt: new Date(),
        }
        
        if (kitchen === 'a') {
          updates.cocinaAStatus = status
        } else {
          updates.cocinaBStatus = status
        }

        // When a kitchen starts preparing, claim "ambas" items exclusively
        // Only claim if the other kitchen has NO exclusive items in this order
        if (status === 'preparando') {
          const hasAmbasItems = order.items.some(i => i.menuItem.cocina === 'ambas')
          if (hasAmbasItems) {
            const otherKitchenKey = kitchen === 'a' ? 'cocina_b' : 'cocina_a'
            const otherHasExclusiveItems = order.items.some(i => i.menuItem.cocina === otherKitchenKey)
            
            if (!otherHasExclusiveItems) {
              // All items relevant to the other kitchen are "ambas" - claim exclusively
              if (kitchen === 'a' && order.cocinaBStatus === 'en_cola') {
                updates.cocinaBStatus = 'listo'
                updates.claimedByKitchen = 'cocina_a'
              } else if (kitchen === 'b' && order.cocinaAStatus === 'en_cola') {
                updates.cocinaAStatus = 'listo'
                updates.claimedByKitchen = 'cocina_b'
              }
            }
          }
        }
        
        if (status === 'preparando' && !order.tiempoInicioPreparacion) {
          updates.tiempoInicioPreparacion = new Date()
        }
        
        // Update overall status based on kitchen statuses
        const newCocinaA = updates.cocinaAStatus ?? (kitchen === 'a' ? status : order.cocinaAStatus)
        const newCocinaB = updates.cocinaBStatus ?? (kitchen === 'b' ? status : order.cocinaBStatus)
        
        // Check if any items need this kitchen
        const needsA = order.items.some(i => i.menuItem.cocina === 'cocina_a' || i.menuItem.cocina === 'ambas')
        const needsB = order.items.some(i => i.menuItem.cocina === 'cocina_b' || i.menuItem.cocina === 'ambas')
        
        const aReady = !needsA || newCocinaA === 'listo'
        const bReady = !needsB || newCocinaB === 'listo'
        
        if (aReady && bReady) {
          updates.status = 'listo'
          if (!order.tiempoFinPreparacion) {
            updates.tiempoFinPreparacion = new Date()
          }
        } else if (newCocinaA === 'preparando' || newCocinaB === 'preparando') {
          updates.status = 'preparando'
        }
        
        return { ...order, ...updates }
      })
      
      // 🔥 SYNC session.orders with updated orders
      const updatedSessions = prev.tableSessions.map(session => ({
        ...session,
        orders: session.orders.map(o => updatedOrders.find(uo => uo.id === o.id) || o),
      }))
      
      return { 
        ...prev, 
        orders: updatedOrders,
        tableSessions: updatedSessions,
      }
    })
  }, [])
  
  // ============ TABLE SESSION ACTIONS ============
  const setCurrentTable = useCallback((mesa: number | null) => {
    setState(prev => ({ ...prev, currentTable: mesa }))
  }, [])
  
  const getTableSession = useCallback((mesa: number): TableSession | undefined => {
    return state.tableSessions.find(s => s.mesa === mesa && s.activa)
  }, [state.tableSessions])
  
  const createTableSession = useCallback((mesa: number): TableSession => {
    const existingSession = state.tableSessions.find(s => s.mesa === mesa && s.activa)
    if (existingSession) {
      setState(prev => ({ ...prev, currentTable: mesa, currentSessionId: existingSession.id }))
      return existingSession
    }
    
    const session: TableSession = {
      id: generateId(),
      mesa,
      activa: true,
      orders: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + state.config.tiempoExpiracionSesionMinutos * 60 * 1000),
      deviceId: generateDeviceId(),
      billStatus: 'abierta',
      subtotal: 0,
      impuestos: 0,
      propina: 0,
      descuento: 0,
      total: 0,
      paymentStatus: 'pendiente',
    }
    
    setState(prev => ({
      ...prev,
      tableSessions: [...prev.tableSessions, session],
      currentTable: mesa,
      currentSessionId: session.id,
    }))
    
    return session
  }, [state.tableSessions, state.config.tiempoExpiracionSesionMinutos])
  
  const closeTableSession = useCallback((sessionId: string) => {
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session) return prev

      return {
        ...prev,
        // Remove orders from global active list
        orders: prev.orders.filter(o => o.mesa !== session.mesa),
        // Mark session as closed but KEEP orders for historical records
        tableSessions: prev.tableSessions.map(s =>
          s.id === sessionId
            ? {
                ...s,
                activa: false,
                billStatus: 'cerrada' as BillStatus,
              }
            : s
        ),
        // Invalidate all QR tokens for this table so the next QR scan creates a new session
        qrTokens: prev.qrTokens.map(t =>
          t.mesa === session.mesa && t.activo
            ? { ...t, activo: false }
            : t
        ),
        // Clear current context if it was this table
        currentTable: prev.currentTable === session.mesa ? null : prev.currentTable,
        currentSessionId: prev.currentSessionId === sessionId ? null : prev.currentSessionId,
        cart: prev.currentTable === session.mesa ? [] : prev.cart,
      }
    })
  }, [])
  
  const isSessionValid = useCallback((mesa: number): boolean => {
    const session = state.tableSessions.find(s => s.mesa === mesa && s.activa)
    if (!session) return true // No session = can create new
    
    if (new Date(session.expiresAt) < new Date()) {
      return false // Session expired
    }
    
    if (session.billStatus === 'cerrada') {
  return false
}

    
    return true
  }, [state.tableSessions])
  
  // ============ BILL/PAYMENT ACTIONS ============
  const updateBillTotals = useCallback((sessionId: string) => {
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session) return prev
      
      const subtotal = session.orders.reduce((sum, o) => sum + calculateOrderTotal(o.items), 0)
      const impuestos = subtotal * (prev.config.impuestoPorcentaje / 100)
      const total = subtotal + impuestos + session.propina - session.descuento
      
      return {
        ...prev,
        tableSessions: prev.tableSessions.map(s =>
          s.id === sessionId ? { ...s, subtotal, impuestos, total } : s
        ),
      }
    })
  }, [])
  
  const applyDiscount = useCallback((sessionId: string, descuento: number, motivo: string) => {
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session || session.billStatus === 'pagada') return prev
      
      const total = session.subtotal + session.impuestos + session.propina - descuento
      
      return {
        ...prev,
        tableSessions: prev.tableSessions.map(s =>
          s.id === sessionId ? { ...s, descuento, descuentoMotivo: motivo, total } : s
        ),
      }
    })
  }, [])
  
  const setTipAmount = useCallback((sessionId: string, propina: number) => {
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session || session.billStatus === 'pagada') return prev
      
      const total = session.subtotal + session.impuestos + propina - session.descuento
      
      return {
        ...prev,
        tableSessions: prev.tableSessions.map(s =>
          s.id === sessionId ? { ...s, propina, total } : s
        ),
      }
    })
  }, [])
  
  const requestPayment = useCallback((sessionId: string, method: PaymentMethod) => {
    setState(prev => ({
      ...prev,
      tableSessions: prev.tableSessions.map(s =>
        s.id === sessionId ? { ...s, paymentMethod: method, paymentStatus: 'solicitado' as PaymentStatus } : s
      ),
    }))
  }, [])
  
  const confirmPayment = useCallback((sessionId: string) => {
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session) return prev

      // Remove the session entirely so the table is fully freed
      return {
        ...prev,
        tableSessions: prev.tableSessions.filter(s => s.id !== sessionId),
        // Invalidate all QR tokens for this table
        qrTokens: prev.qrTokens.map(t =>
          t.mesa === session.mesa && t.activo
            ? { ...t, activo: false }
            : t
        ),
        // Remove active orders for this table from the global list
        orders: prev.orders.filter(o => o.mesa !== session.mesa),
        // Dismiss any pending waiter calls for this table
        waiterCalls: prev.waiterCalls.filter(c => c.mesa !== session.mesa || c.atendido),
        // Clear current context if it was this table
        currentTable: prev.currentTable === session.mesa ? null : prev.currentTable,
        currentSessionId: prev.currentSessionId === sessionId ? null : prev.currentSessionId,
        cart: prev.currentTable === session.mesa ? [] : prev.cart,
      }
    })
  }, [])

const resetSessionPaymentStatus = useCallback((sessionId: string) => {
  setState(prev => ({
    ...prev,
    tableSessions: prev.tableSessions.map(s =>
      s.id === sessionId
        ? {
            ...s,
            paymentStatus: 'pendiente',
            paymentMethod: undefined,
            billStatus: 'abierta',
          }
        : s
    ),
  }))
}, [])



  
  const markFeedbackDone = useCallback((sessionId: string) => {
  setState(prev => ({
    ...prev,
    tableSessions: prev.tableSessions.map(s =>
      s.id === sessionId
        ? { ...s, feedbackDone: true }
        : s
    ),
  }))
}, [])

  // ============ EMERGENCY ACTIONS ============
  const emergencyCloseAllTables = useCallback(() => {
    setState(prev => {
      // Gather all mesas that have active sessions
      const activeMesas = new Set(prev.tableSessions.filter(s => s.activa).map(s => s.mesa))

      return {
        ...prev,
        // Remove all active sessions (keeps inactive ones for history)
        tableSessions: prev.tableSessions.filter(s => !s.activa),
        // Remove orders associated with active tables
        orders: prev.orders.filter(o => !o.mesa || !activeMesas.has(o.mesa)),
        // Invalidate QR tokens for active tables
        qrTokens: prev.qrTokens.map(t =>
          activeMesas.has(t.mesa) && t.activo ? { ...t, activo: false } : t
        ),
        // Dismiss waiter calls for active tables
        waiterCalls: prev.waiterCalls.filter(c => !activeMesas.has(c.mesa) || c.atendido),
        // Clear current table context
        currentTable: null,
        currentSessionId: null,
        cart: [],
      }
    })
  }, [])
  
  const getSessionBill = useCallback((sessionId: string): TableSession | undefined => {
    return state.tableSessions.find(s => s.id === sessionId)
  }, [state.tableSessions])
  
  // ============ WAITER CALL ACTIONS ============
  const createWaiterCall = useCallback((mesa: number, tipo: 'atencion' | 'cuenta' | 'otro', mensaje?: string) => {
    const call: WaiterCall = {
      id: generateId(),
      mesa,
      tipo,
      mensaje,
      atendido: false,
      createdAt: new Date(),
    }
    
    setState(prev => ({
      ...prev,
      waiterCalls: [...prev.waiterCalls, call],
    }))
  }, [])
  
  const markCallAttended = useCallback((callId: string, userId: string) => {
    setState(prev => ({
      ...prev,
      waiterCalls: prev.waiterCalls.map(c =>
        c.id === callId ? { ...c, atendido: true, atendidoPor: userId, atendidoAt: new Date() } : c
      ),
    }))
  }, [])
  
  const getPendingCalls = useCallback((): WaiterCall[] => {
    return state.waiterCalls.filter(c => !c.atendido)
  }, [state.waiterCalls])
  
  // ============ REWARD ACTIONS ============
  const applyReward = useCallback((sessionId: string, rewardId: string): boolean => {
    const reward = state.rewards.find(r => r.id === rewardId && r.activo)
    if (!reward) return false
    
    const session = state.tableSessions.find(s => s.id === sessionId)
    if (!session || session.billStatus === 'pagada') return false
    
    // Check if already used
    const alreadyUsed = state.appliedRewards.filter(ar => ar.sessionId === sessionId && ar.rewardId === rewardId).length
    if (reward.usosMaximos && alreadyUsed >= reward.usosMaximos) return false
    
    let descuento = 0
    if (reward.tipo === 'porcentaje') {
      descuento = session.subtotal * (reward.valor / 100)
    } else {
      descuento = reward.valor
    }
    
    const applied: AppliedReward = {
      id: generateId(),
      sessionId,
      rewardId,
      descuento,
      createdAt: new Date(),
    }
    
    setState(prev => ({
      ...prev,
      appliedRewards: [...prev.appliedRewards, applied],
      tableSessions: prev.tableSessions.map(s =>
        s.id === sessionId ? { 
          ...s, 
          descuento: s.descuento + descuento, 
          descuentoMotivo: reward.nombre,
          total: s.subtotal + s.impuestos + s.propina - (s.descuento + descuento),
        } : s
      ),
    }))
    
    return true
  }, [state.rewards, state.tableSessions, state.appliedRewards])
  
  const getAvailableRewards = useCallback((sessionId: string): Reward[] => {
    return state.rewards.filter(r => {
      if (!r.activo) return false
      const usedCount = state.appliedRewards.filter(ar => ar.sessionId === sessionId && ar.rewardId === r.id).length
      if (r.usosMaximos && usedCount >= r.usosMaximos) return false
      return true
    })
  }, [state.rewards, state.appliedRewards])
  
  // ============ MENU ACTIONS ============
  const updateMenuItem = useCallback((itemId: string, updates: Partial<MenuItem>) => {
    setState(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }))
  }, [])
  
  const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>) => {
    setState(prev => ({
      ...prev,
      menuItems: [...prev.menuItems, { ...item, id: generateId() }],
    }))
  }, [])
  
  const deleteMenuItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      menuItems: prev.menuItems.filter(item => item.id !== itemId),
    }))
  }, [])
  
  const getAvailableMenuItems = useCallback((): MenuItem[] => {
    return state.menuItems.filter(item => {
      if (!item.disponible) return false
      const { canPrepare } = canPrepareItem(item, state.ingredients)
      return canPrepare
    })
  }, [state.menuItems, state.ingredients])
  
  // ============ CATEGORY ACTIONS ============
  const addCategory = useCallback((nombre: string) => {
    const newCategory: MenuCategory = {
      id: generateId(),
      nombre,
      orden: state.categories.length + 1,
      activa: true,
    }
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))
  }, [state.categories.length])
  
  const updateCategory = useCallback((categoryId: string, updates: Partial<MenuCategory>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ),
    }))
  }, [])
  
  const deleteCategory = useCallback((categoryId: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== categoryId),
    }))
  }, [])
  
  const reorderCategories = useCallback((categoryIds: string[]) => {
    setState(prev => ({
      ...prev,
      categories: categoryIds.map((id, index) => {
        const cat = prev.categories.find(c => c.id === id)
        return cat ? { ...cat, orden: index + 1 } : null
      }).filter((c): c is MenuCategory => c !== null),
    }))
  }, [])
  
  // ============ TABLE ACTIONS ============
  const addTable = useCallback((numero: number, capacidad = 4, ubicacion?: string) => {
    const newTable: TableConfig = {
      id: generateId(),
      numero,
      capacidad,
      ubicacion,
      activa: true,
      createdAt: new Date(),
    }
    setState(prev => ({
      ...prev,
      tables: [...prev.tables, newTable],
    }))
  }, [])
  
  const updateTable = useCallback((tableId: string, updates: Partial<TableConfig>) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(table =>
        table.id === tableId ? { ...table, ...updates } : table
      ),
    }))
  }, [])
  
  const deleteTable = useCallback((tableId: string) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.filter(table => table.id !== tableId),
    }))
  }, [])
  
  const getActiveTables = useCallback((): TableConfig[] => {
    return state.tables.filter(t => t.activa).sort((a, b) => a.numero - b.numero)
  }, [state.tables])
  
  // ============ INVENTORY ACTIONS ============
  const updateIngredient = useCallback((ingredientId: string, updates: Partial<Ingredient>) => {
    setState(prev => {
      const newIngredients = prev.menuItems.map(item => {
        const { canPrepare } = canPrepareItem(item, prev.ingredients.map(i =>
          i.id === ingredientId ? { ...i, ...updates } : i
        ))
        return { ...item, disponible: canPrepare }
      })
      
      return {
        ...prev,
        ingredients: prev.ingredients.map(ing =>
          ing.id === ingredientId ? { ...ing, ...updates } : ing
        ),
        menuItems: newIngredients,
      }
    })
  }, [])
  
  const addIngredient = useCallback((ingredient: Omit<Ingredient, 'id'>) => {
    setState(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...ingredient, id: generateId() }],
    }))
  }, [])
  
  const adjustInventory = useCallback((ingredientId: string, tipo: 'entrada' | 'salida' | 'merma' | 'ajuste', cantidad: number, motivo: string) => {
    const adjustment: InventoryAdjustment = {
      id: generateId(),
      ingredientId,
      tipo,
      cantidad,
      motivo,
      userId: state.currentUser?.id || 'system',
      createdAt: new Date(),
    }
    
    setState(prev => {
      const newIngredients = prev.ingredients.map(ing => {
        if (ing.id !== ingredientId) return ing
        
        let newStock = ing.stockActual
        if (tipo === 'entrada') {
  newStock += cantidad
} else if (tipo === 'ajuste') {
  newStock = cantidad
} else {
  newStock = Math.max(0, newStock - cantidad)
}
        
        // Round to 2 decimals to avoid floating point accumulation
        newStock = Math.round(newStock * 100) / 100
        
        return { ...ing, stockActual: newStock }
      })
      
      // Update menu availability
      const menuItems = prev.menuItems.map(item => {
        const { canPrepare } = canPrepareItem(item, newIngredients)
        return { ...item, disponible: canPrepare }
      })
      
      return {
        ...prev,
        ingredients: newIngredients,
        menuItems,
        inventoryAdjustments: [...prev.inventoryAdjustments, adjustment],
      }
    })
  }, [state.currentUser])
  
  const getLowStockIngredients = useCallback((): Ingredient[] => {
    return state.ingredients.filter(ing => ing.stockActual <= ing.stockMinimo)
  }, [state.ingredients])
  
  // ============ USER MANAGEMENT ============
  const addUser = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      users: [...prev.users, { ...user, id: generateId(), createdAt: new Date() }],
    }))
  }, [])
  
  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u),
    }))
  }, [])
  
  const deleteUser = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, activo: false } : u),
    }))
  }, [])
  
  // ============ CONFIG ============
  const updateConfig = useCallback((updates: Partial<AppConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }))
  }, [])
  
  // ============ AUDIT ============
  const logAction = useCallback((accion: string, detalles: string, entidad: string, entidadId: string) => {
    const log: AuditLog = {
      id: generateId(),
      userId: state.currentUser?.id || 'anonymous',
      accion,
      detalles,
      entidad,
      entidadId,
      createdAt: new Date(),
    }
    
    setState(prev => ({
      ...prev,
      auditLogs: [...prev.auditLogs, log],
    }))
  }, [state.currentUser])
  
  // ============ ORDER CANCEL/EDIT ACTIONS ============
  const cancelOrder = useCallback((orderId: string, reason: CancelReason, motivo?: string, userId?: string): boolean => {
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return false
    
    // Can only cancel if not already delivered or cancelled
    if (order.status === 'entregado' || order.status === 'cancelado') return false
    
    // Restore ingredients for any order that was created (ingredients were deducted at creation)
    let newIngredients = [...state.ingredients]
    for (const item of order.items) {
      newIngredients = restoreIngredients(item.menuItem, item.cantidad, newIngredients, item.extras)
    }
    
    setState(prev => {
      // Completely remove the order from the orders array
      const updatedOrders = prev.orders.filter(o => o.id !== orderId)

      // Remove from session.orders and recalculate totals
      const updatedSessions = prev.tableSessions.map(session => {
        const filteredOrders = session.orders.filter(o => o.id !== orderId)
        if (filteredOrders.length === session.orders.length) return session
        
        const subtotal = filteredOrders.reduce(
          (sum, o) => sum + calculateOrderTotal(o.items), 0
        )
        const impuestos = subtotal * (prev.config.impuestoPorcentaje / 100)
        
        return {
          ...session,
          orders: filteredOrders,
          subtotal,
          impuestos,
          total: subtotal + impuestos + session.propina - session.descuento,
        }
      })

      // Update menu availability with restored ingredients
      const menuItems = prev.menuItems.map(item => {
        const { canPrepare } = canPrepareItem(item, newIngredients)
        return { ...item, disponible: canPrepare }
      })

      return {
        ...prev,
        orders: updatedOrders,
        tableSessions: updatedSessions,
        ingredients: newIngredients,
        menuItems,
      }
    })
    
    return true
  }, [state.orders, state.ingredients])
  
  const updateOrderItems = useCallback((orderId: string, items: OrderItem[]): boolean => {
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return false
    
    // Can only edit if status is 'recibido'
    if (order.status !== 'recibido') return false
    
    setState(prev => {
      const updatedOrders = prev.orders.map(o =>
        o.id === orderId ? { ...o, items, updatedAt: new Date() } : o
      )

      // Sync session.orders with updated orders AND recalculate totals
      const updatedSessions = prev.tableSessions.map(session => {
        const syncedOrders = session.orders.map(o => updatedOrders.find(uo => uo.id === o.id) || o)
        
        // Check if this session contains the edited order
        const containsOrder = session.orders.some(o => o.id === orderId)
        if (!containsOrder) {
          return { ...session, orders: syncedOrders }
        }
        
        // Recalculate totals for the session
        const subtotal = syncedOrders.reduce(
          (sum, o) => sum + calculateOrderTotal(o.items),
          0
        )
        const impuestos = subtotal * (prev.config.impuestoPorcentaje / 100)
        
        return {
          ...session,
          orders: syncedOrders,
          subtotal,
          impuestos,
          total: subtotal + impuestos + session.propina - session.descuento,
        }
      })

      return {
        ...prev,
        orders: updatedOrders,
        tableSessions: updatedSessions,
      }
    })
    
    return true
  }, [state.orders])
  
  const markOrderDelivered = useCallback((orderId: string) => {
  setState(prev => {
    const order = prev.orders.find(o => o.id === orderId)
    if (!order || !order.mesa) return prev

    const updatedOrders = prev.orders.map(o =>
      o.id === orderId
        ? { ...o, status: 'entregado' as OrderStatus, updatedAt: new Date() }
        : o
    )

    // Sync session.orders with updated orders
    const updatedSessions = prev.tableSessions.map(session => {
      if (session.mesa !== order.mesa || !session.activa) return session
      
      const syncedOrders = session.orders.map(o => 
        updatedOrders.find(uo => uo.id === o.id) || o
      )
      
      return { ...session, orders: syncedOrders }
    })

    return {
      ...prev,
      orders: updatedOrders,
      tableSessions: updatedSessions,
    }
  })
}, [])

  
  const canEditOrder = useCallback((orderId: string): boolean => {
    const order = state.orders.find(o => o.id === orderId)
    if (!order || order.status !== 'recibido') return false
    // Block editing if the session is already paid
    if (order.mesa) {
      const session = state.tableSessions.find(s => s.mesa === order.mesa && s.activa)
      if (session && session.billStatus === 'pagada') return false
    }
    return true
  }, [state.orders, state.tableSessions])
  
  const canCancelOrder = useCallback((orderId: string): boolean => {
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return false
    if (order.status !== 'recibido') return false
    // Block cancellation if the session is already paid
    if (order.mesa) {
      const session = state.tableSessions.find(s => s.mesa === order.mesa && s.activa)
      if (session && session.billStatus === 'pagada') return false
    }
    return true
  }, [state.orders, state.tableSessions])

  
  // ============ QR TOKEN ACTIONS ============
  const generateTableQR = useCallback((mesa: number): QRToken => {
    // Invalidate any existing active tokens for this table
    setState(prev => ({
      ...prev,
      qrTokens: prev.qrTokens.map(t =>
        t.mesa === mesa && t.activo ? { ...t, activo: false } : t
      ),
    }))
    
    const newToken = createQRToken(mesa, state.config.tiempoExpiracionSesionMinutos)
    
    setState(prev => ({
      ...prev,
      qrTokens: [...prev.qrTokens, newToken],
    }))
    
    return newToken
  }, [state.config.tiempoExpiracionSesionMinutos])
  
  const validateTableQR = useCallback((token: string): { valid: boolean; mesa?: number; token?: QRToken } => {
    const qrToken = validateQRToken(token, state.qrTokens)
    if (!qrToken) {
      return { valid: false }
    }
    return { valid: true, mesa: qrToken.mesa, token: qrToken }
  }, [state.qrTokens])
  
  const invalidateTableQR = useCallback((tokenId: string) => {
    setState(prev => ({
      ...prev,
      qrTokens: prev.qrTokens.map(t =>
        t.id === tokenId ? { ...t, activo: false } : t
      ),
    }))
  }, [])
  
  const getActiveQRForTable = useCallback((mesa: number): QRToken | undefined => {
    return state.qrTokens.find(t => t.mesa === mesa && t.activo && new Date(t.expiresAt) > new Date())
  }, [state.qrTokens])
  
  // ============ REFUND ACTIONS ============
  const createRefund = useCallback((
    orderId: string,
    monto: number,
    motivo: string,
    tipo: 'total' | 'parcial',
    itemIds?: string[],
    userId?: string
  ): Refund | null => {
    const order = state.orders.find(o => o.id === orderId)
    if (!order) return null
    
    // Restore ingredients for refunded items
    let newIngredients = [...state.ingredients]
    const itemsToRestore = tipo === 'total' 
      ? order.items 
      : order.items.filter(i => itemIds?.includes(i.id))
    
    for (const item of itemsToRestore) {
      newIngredients = restoreIngredients(item.menuItem, item.cantidad, newIngredients, item.extras)
    }
    
    const refund: Refund = {
      id: generateId(),
      orderId,
      monto,
      motivo,
      tipo,
      itemsReembolsados: itemIds,
      inventarioRevertido: true,
      userId: userId || state.currentUser?.id || 'unknown',
      createdAt: new Date(),
    }
    
    setState(prev => ({
      ...prev,
      refunds: [...prev.refunds, refund],
      ingredients: newIngredients,
    }))
    
    return refund
  }, [state.orders, state.ingredients, state.currentUser])
  
  const getOrderRefunds = useCallback((orderId: string): Refund[] => {
    return state.refunds.filter(r => r.orderId === orderId)
  }, [state.refunds])
  
  // ============ DELIVERY ZONE ACTIONS ============
  const getDeliveryZones = useCallback((): DeliveryZone[] => {
    return state.deliveryZones.filter(z => z.activa)
  }, [state.deliveryZones])
  
  const updateDeliveryZone = useCallback((zonaNombre: string, updates: Partial<DeliveryZone>) => {
    setState(prev => ({
      ...prev,
      deliveryZones: prev.deliveryZones.map(z =>
        z.nombre === zonaNombre ? { ...z, ...updates } : z
      ),
    }))
  }, [])
  
  const addDeliveryZone = useCallback((zone: DeliveryZone) => {
    setState(prev => ({
      ...prev,
      deliveryZones: [...prev.deliveryZones, zone],
    }))
  }, [])
  
  const calculateDeliveryCost = useCallback((zonaNombre: string): number => {
    return getDeliveryZoneCost(zonaNombre, state.deliveryZones)
  }, [state.deliveryZones])
  
  // ============ UTILITY FUNCTIONS ============
  const getOrdersForKitchen = useCallback((kitchen: 'a' | 'b'): Order[] => {
    return state.orders.filter(order => {
      if (order.status === 'entregado') return false
      
      const kitchenStatus = kitchen === 'a' ? order.cocinaAStatus : order.cocinaBStatus
      const kitchenKey = kitchen === 'a' ? 'cocina_a' : 'cocina_b'
      
      const hasItems = order.items.some(
        item => item.menuItem.cocina === kitchenKey || item.menuItem.cocina === 'ambas'
      )
      
      return hasItems && kitchenStatus !== 'listo'
    })
  }, [state.orders])
  
  const getPendingDeliveries = useCallback((): Order[] => {
    return state.orders.filter(
      order => order.status === 'listo'
    )
  }, [state.orders])
  
  const getTableOrders = useCallback((mesa: number): Order[] => {
    return state.orders.filter(o => o.mesa === mesa)
  }, [state.orders])
  
  const getAllActiveOrders = useCallback((): Order[] => {
    return state.orders.filter(o => o.status !== 'entregado')
  }, [state.orders])
  
  const getPaymentsForDate = useCallback((date: Date) => {
  const target = date.toISOString().split("T")[0]

  return state.tableSessions.filter(session => {
    if (!session.paidAt) return false

    const paidDate = new Date(session.paidAt).toISOString().split("T")[0]
    return paidDate === target
  })
}, [state.tableSessions])
  
  const value: AppContextType = {
    ...state,
    login,
    logout,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    createOrder,
    updateOrderStatus,
    updateKitchenStatus,
    cancelOrder,
    updateOrderItems,
    markOrderDelivered,
    setCurrentTable,
    getTableSession,
    createTableSession,
    closeTableSession,
    isSessionValid,
    updateBillTotals,
    applyDiscount,
    setTipAmount,
    requestPayment,
    confirmPayment,
    getSessionBill,
    createWaiterCall,
    markCallAttended,
    getPendingCalls,
    applyReward,
    getAvailableRewards,
    updateMenuItem,
    addMenuItem,
      deleteMenuItem,
      getAvailableMenuItems,
      categories: state.categories,
      addCategory,
      updateCategory,
      deleteCategory,
      reorderCategories,
      tables: state.tables,
      addTable,
      updateTable,
      deleteTable,
      getActiveTables,
      updateIngredient,
    addIngredient,
    adjustInventory,
    getLowStockIngredients,
    addUser,
    updateUser,
    deleteUser,
    updateConfig,
    logAction,
    getOrdersForKitchen,
    getPendingDeliveries,
    getTableOrders,
    getAllActiveOrders,
    getPaymentsForDate,
    canEditOrder,
    canCancelOrder,
    generateTableQR,
    validateTableQR,
    invalidateTableQR,
    getActiveQRForTable,
    createRefund,
    getOrderRefunds,
    getDeliveryZones,
    updateDeliveryZone,
    addDeliveryZone,
    calculateDeliveryCost,
    resetSessionPaymentStatus,
    markFeedbackDone,
  emergencyCloseAllTables,
  }
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
