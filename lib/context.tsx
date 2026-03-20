'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { supabase } from "./supabase"
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

async function uploadMenuImage(file: File): Promise<string | null> {
  const fileName = `${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('menu-images').upload(fileName, file)
  if (error) { console.error('Error subiendo imagen:', error); return null }
  const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName)
  return data.publicUrl
}

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
  login: (username: string, password: string) => Promise<User | null>
  logout: () => Promise<void>
  
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
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>, imageFile?: File) => void
  addMenuItem: (item: Omit<MenuItem, 'id'>, imageFile?: File) => Promise<void>
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
  emergencyCloseTables: (tables: number[]) => void
  
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

// ── DB row → app type mappers ─────────────────────────────────────────────────
function mapMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as string,
    nombre: row.name as string,
    descripcion: (row.description as string) ?? '',
    precio: Number(row.price) || 0,
    categoria: (row.category_id as string) ?? '',
    cocina: (row.cocina as MenuItem['cocina']) ?? 'cocina_a',
    disponible: (row.available as boolean) ?? true,
    imagen: (row.image as string) ?? undefined,
    orden: (row.orden as number) ?? 0,
  }
}

function mapCategory(row: Record<string, unknown>): MenuCategory {
  return {
    id: row.id as string,
    nombre: row.name as string,
    activa: (row.activa as boolean) ?? true,
    orden: (row.orden as number) ?? 0,
  }
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    numero: (row.numero as number) ?? 0,
    canal: row.canal as Channel,
    mesa: (row.mesa as number) ?? undefined,
    items: (row.items as OrderItem[]) ?? [],
    status: (row.status as OrderStatus) ?? 'recibido',
    cocinaAStatus: (row.cocina_a_status as KitchenStatus) ?? 'en_cola',
    cocinaBStatus: (row.cocina_b_status as KitchenStatus) ?? 'en_cola',
    nombreCliente: (row.nombre_cliente as string) ?? undefined,
    telefono: (row.telefono as string) ?? undefined,
    direccion: (row.direccion as string) ?? undefined,
    zonaReparto: (row.zona_reparto as string) ?? undefined,
    claimedByKitchen: (row.claimed_by_kitchen as 'cocina_a' | 'cocina_b') ?? undefined,
    cancelado: (row.cancelado as boolean) ?? false,
    cancelReason: (row.cancel_reason as CancelReason) ?? undefined,
    cancelMotivo: (row.cancel_motivo as string) ?? undefined,
    canceladoPor: (row.cancelado_por as string) ?? undefined,
    tiempoInicioPreparacion: row.tiempo_inicio_preparacion ? new Date(row.tiempo_inicio_preparacion as string) : undefined,
    tiempoFinPreparacion: row.tiempo_fin_preparacion ? new Date(row.tiempo_fin_preparacion as string) : undefined,
    canceladoAt: row.cancelado_at ? new Date(row.cancelado_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

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
        categories: (parsed.categories && parsed.categories.length > 0) ? parsed.categories : DEFAULT_CATEGORIES,
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

  // Restore Supabase session on mount + listen for auth changes
  useEffect(() => {
    const restoreProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile) {
        const user: User = {
          id: profile.id,
          username: profile.username,
          nombre: profile.nombre,
          role: profile.role as UserRole,
          activo: profile.activo,
          createdAt: new Date(profile.created_at),
        }
        setState(prev => ({ ...prev, currentUser: user }))
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) restoreProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        restoreProfile(session.user.id)
      } else {
        setState(prev => ({ ...prev, currentUser: null }))
      }
    })

    return () => subscription.unsubscribe()
  }, [])
  
  useEffect(() => {

  const cargarMenu = async () => {
    const { data, error } = await supabase.from("menu_items").select("*")
    if (error) { console.error("Error cargando menu:", error); return }
    if (data) setState(prev => ({ ...prev, menuItems: data.map(mapMenuItem) }))
  }

  const cargarCategorias = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("orden")
    if (error) { console.error("Error cargando categorias:", error); return }
    if (data) {
      setState(prev => {
        const existingMap = new Map(prev.categories.map(c => [c.id, c]))
        const categorias = data.map((row, idx) => {
          const existing = existingMap.get(row.id as string)
          return mapCategory({ ...row, orden: existing?.orden ?? row.orden ?? idx + 1 })
        }).sort((a, b) => a.orden - b.orden)
        return { ...prev, categories: categorias }
      })
    }
  }

  const cargarOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .not('status', 'in', '("entregado","cancelado")')
      .order('created_at')
    if (error) { console.error('Error cargando pedidos:', error); return }
    if (data) setState(prev => ({ ...prev, orders: data.map(mapOrder) }))
  }

  const cargarUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('id, username, nombre, role, activo, created_at').order('created_at')
    if (error) { console.error('Error cargando usuarios:', error); return }
    if (data) {
      const users: User[] = data.map(p => ({
        id: p.id,
        username: p.username,
        nombre: p.nombre,
        role: p.role as UserRole,
        activo: p.activo,
        createdAt: new Date(p.created_at),
      }))
      setState(prev => ({ ...prev, users }))
    }
  }

  const cargarIngredientes = async () => {
    const { data, error } = await supabase.from('ingredients').select('*').eq('activo', true).order('nombre')
    if (error) { console.error('Error cargando ingredientes:', error); return }
    if (data && data.length > 0) {
      const ingredientes: Ingredient[] = data.map(row => ({
        id: row.id as string,
        nombre: row.nombre as string,
        categoria: row.categoria as string,
        unidad: row.unidad as Ingredient['unidad'],
        stockActual: Number(row.stock_actual) ?? 0,
        stockMinimo: Number(row.stock_minimo) ?? 0,
        cantidadMaxima: Number(row.cantidad_maxima) ?? 0,
        costoUnitario: Number(row.costo_unitario) ?? 0,
        activo: row.activo as boolean,
      }))
      setState(prev => ({ ...prev, ingredients: ingredientes }))
    }
  }

  const cargarAjustes = async () => {
    const since = new Date()
    since.setMonth(since.getMonth() - 3) // load last 3 months
    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
    if (error) { console.error('Error cargando ajustes:', error); return }
    if (data && data.length > 0) {
      const ajustes: InventoryAdjustment[] = data.map(row => ({
        id: row.id as string,
        ingredientId: row.ingredient_id as string,
        tipo: row.tipo as InventoryAdjustment['tipo'],
        cantidad: Number(row.cantidad),
        motivo: row.motivo as string,
        userId: row.user_id as string ?? 'system',
        createdAt: new Date(row.created_at as string),
      }))
      setState(prev => ({ ...prev, inventoryAdjustments: ajustes }))
    }
  }

  const cargarSesiones = async () => {
    const { data, error } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('activa', true)
    if (error) { console.error('Error cargando sesiones:', error); return }
    if (data && data.length > 0) {
      const sesiones: TableSession[] = data.map(row => ({
        id: row.id as string,
        mesa: row.mesa as number,
        activa: row.activa as boolean,
        orders: [],
        createdAt: new Date(row.created_at as string),
        expiresAt: row.expires_at ? new Date(row.expires_at as string) : new Date(Date.now() + 3 * 60 * 60 * 1000),
        deviceId: row.device_id as string ?? '',
        billStatus: row.bill_status as BillStatus,
        subtotal: Number(row.subtotal) ?? 0,
        impuestos: Number(row.impuestos) ?? 0,
        propina: Number(row.propina) ?? 0,
        descuento: Number(row.descuento) ?? 0,
        descuentoMotivo: row.descuento_motivo as string | undefined,
        total: Number(row.total) ?? 0,
        paymentMethod: row.payment_method as PaymentMethod | undefined,
        paymentStatus: row.payment_status as PaymentStatus,
        paidAt: row.paid_at ? new Date(row.paid_at as string) : undefined,
      }))
      setState(prev => ({ ...prev, tableSessions: sesiones }))
    }
  }

  const cargarReembolsos = async () => {
    const since = new Date()
    since.setMonth(since.getMonth() - 3)
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
    if (error) { console.error('Error cargando reembolsos:', error); return }
    if (data && data.length > 0) {
      const refunds: Refund[] = data.map(row => ({
        id: row.id as string,
        orderId: row.order_id as string,
        sessionId: row.session_id as string | undefined,
        monto: Number(row.monto),
        motivo: row.motivo as string,
        tipo: row.tipo as Refund['tipo'],
        itemsReembolsados: row.items_reembolsados as string[] | undefined,
        inventarioRevertido: row.inventario_revertido as boolean,
        userId: row.user_id as string,
        createdAt: new Date(row.created_at as string),
      }))
      setState(prev => ({ ...prev, refunds }))
    }
  }

  const cargarConfig = async () => {
    const { data, error } = await supabase.from('app_config').select('*').eq('id', 'default').single()
    if (error) { console.error('Error cargando config:', error); return }
    if (data) {
      const config: AppConfig = {
        impuestoPorcentaje: Number(data.impuesto_porcentaje) ?? 16,
        propinaSugeridaPorcentaje: Number(data.propina_sugerida_porcentaje) ?? 15,
        tiempoExpiracionSesionMinutos: Number(data.tiempo_expiracion_sesion_minutos) ?? 180,
        zonasReparto: (data.zonas_reparto as string[]) ?? [],
        horariosOperacion: (data.horarios_operacion as AppConfig['horariosOperacion']) ?? [],
        metodospagoActivos: (data.metodos_pago_activos as AppConfig['metodospagoActivos']) ?? { efectivo: true, tarjeta: true, transferencia: true },
        sonidoNuevosPedidos: data.sonido_nuevos_pedidos as boolean ?? true,
        notificacionesStockBajo: data.notificaciones_stock_bajo as boolean ?? true,
      }
      setState(prev => ({ ...prev, config }))
    }
  }

  cargarMenu()
  cargarCategorias()
  cargarOrders()
  cargarUsers()
  cargarIngredientes()
  cargarAjustes()
  cargarSesiones()
  cargarReembolsos()
  cargarConfig()

}, [])

  // ── Supabase Realtime ───────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'menu_items' }, (payload) => {
        const item = mapMenuItem(payload.new as Record<string, unknown>)
        setState(prev => ({
          ...prev,
          menuItems: prev.menuItems.some(i => i.id === item.id)
            ? prev.menuItems.map(i => i.id === item.id ? item : i)
            : [...prev.menuItems, item],
        }))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, (payload) => {
        const item = mapMenuItem(payload.new as Record<string, unknown>)
        setState(prev => ({ ...prev, menuItems: prev.menuItems.map(i => i.id === item.id ? item : i) }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'menu_items' }, (payload) => {
        setState(prev => ({ ...prev, menuItems: prev.menuItems.filter(i => i.id !== (payload.old as Record<string, unknown>).id) }))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'categories' }, (payload) => {
        const cat = mapCategory(payload.new as Record<string, unknown>)
        setState(prev => ({
          ...prev,
          categories: prev.categories.some(c => c.id === cat.id)
            ? prev.categories
            : [...prev.categories, cat].sort((a, b) => a.orden - b.orden),
        }))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'categories' }, (payload) => {
        const cat = mapCategory(payload.new as Record<string, unknown>)
        setState(prev => ({
          ...prev,
          categories: prev.categories.map(c => c.id === cat.id ? cat : c),
        }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'categories' }, (payload) => {
        setState(prev => ({
          ...prev,
          categories: prev.categories.filter(c => c.id !== (payload.old as Record<string, unknown>).id),
        }))
      })
      // ── Orders Realtime ─────────────────────────────────────────────────────
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const order = mapOrder(payload.new as Record<string, unknown>)
        setState(prev => ({
          ...prev,
          orders: prev.orders.some(o => o.id === order.id)
            ? prev.orders.map(o => o.id === order.id ? order : o)
            : [...prev.orders, order],
        }))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const order = mapOrder(payload.new as Record<string, unknown>)
        setState(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.id === order.id ? order : o),
          // Sync inside table sessions too
          tableSessions: prev.tableSessions.map(session => ({
            ...session,
            orders: session.orders.map(o => o.id === order.id ? order : o),
          })),
        }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, (payload) => {
        const deletedId = (payload.old as Record<string, unknown>).id as string
        setState(prev => ({
          ...prev,
          orders: prev.orders.filter(o => o.id !== deletedId),
          tableSessions: prev.tableSessions.map(session => ({
            ...session,
            orders: session.orders.filter(o => o.id !== deletedId),
          })),
        }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Save state to localStorage after hydration
  useEffect(() => {
  if (isHydrated) {
    isWritingRef.current = true

    const stateToSave = {
      ...state,
      menuItems: state.menuItems
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))

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
  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    const email = `${username}@pqvv.local`
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!profile || !profile.activo) {
      await supabase.auth.signOut()
      return null
    }

    const user: User = {
      id: profile.id,
      username: profile.username,
      nombre: profile.nombre,
      role: profile.role as UserRole,
      activo: profile.activo,
      createdAt: new Date(profile.created_at),
    }

    setState(prev => ({ ...prev, currentUser: user }))
    return user
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut()
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
    
    // Capture session info to sync after setState
    // eslint-disable-next-line prefer-const
    const sessionSyncRef: { data: { id: string; isNew: boolean; subtotal: number; impuestos: number; total: number; mesa: number; expiresAt: Date; deviceId: string } | null } = { data: null }

    setState(prev => {
      let tableSessions = prev.tableSessions
      if (mesa) {
        const sessionIndex = tableSessions.findIndex(s => s.mesa === mesa && s.activa)
        if (sessionIndex >= 0) {
          const session = tableSessions[sessionIndex]
          const newOrders = [...session.orders, order]
          const subtotal = newOrders.reduce((sum, o) => sum + calculateOrderTotal(o.items), 0)
          const impuestos = subtotal * (prev.config.impuestoPorcentaje / 100)
          const total = subtotal + impuestos + session.propina - session.descuento
          tableSessions = [...tableSessions]
          tableSessions[sessionIndex] = {
            ...session,
            orders: newOrders,
            subtotal,
            impuestos,
            total,
            billStatus: 'abierta',
            paymentStatus: 'pendiente',
            paidAt: undefined,
            receiptId: undefined,
          }
          sessionSyncRef.data = { id: session.id, isNew: false, subtotal, impuestos, total, mesa, expiresAt: session.expiresAt, deviceId: session.deviceId }
        } else {
          const subtotal = calculateOrderTotal(order.items)
          const impuestos = subtotal * (prev.config.impuestoPorcentaje / 100)
          const total = subtotal + impuestos
          const newSession: TableSession = {
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
            total,
            paymentStatus: 'pendiente',
          }
          tableSessions = [...tableSessions, newSession]
          sessionSyncRef.data = { id: newSession.id, isNew: true, subtotal, impuestos, total, mesa, expiresAt: newSession.expiresAt, deviceId: newSession.deviceId }
        }
      }

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

    // Sync session to Supabase
    if (sessionSyncRef.data) {
      const s = sessionSyncRef.data
      if (s.isNew) {
        supabase.from('table_sessions').insert({
          id: s.id,
          mesa: s.mesa,
          activa: true,
          bill_status: 'abierta',
          subtotal: s.subtotal,
          impuestos: s.impuestos,
          propina: 0,
          descuento: 0,
          total: s.total,
          payment_status: 'pendiente',
          device_id: s.deviceId,
          expires_at: s.expiresAt.toISOString(),
        }).then(({ error }) => { if (error) console.error('Error creando sesión:', error) })
      } else {
        supabase.from('table_sessions').update({ subtotal: s.subtotal, impuestos: s.impuestos, total: s.total, bill_status: 'abierta', payment_status: 'pendiente' }).eq('id', s.id)
          .then(({ error }) => { if (error) console.error('Error actualizando sesión:', error) })
      }
    }

    // Persist order to Supabase
    supabase.from('orders').insert({
      id: order.id,
      numero: order.numero,
      canal: order.canal,
      mesa: order.mesa ?? null,
      items: order.items,
      status: order.status,
      cocina_a_status: order.cocinaAStatus,
      cocina_b_status: order.cocinaBStatus,
      nombre_cliente: order.nombreCliente ?? null,
      telefono: order.telefono ?? null,
      direccion: order.direccion ?? null,
      zona_reparto: order.zonaReparto ?? null,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
    }).then(({ error }) => {
      if (error) console.error('Error guardando pedido en Supabase:', error)
    })

    return order
  }, [state.cart, state.ingredients, state.config.impuestoPorcentaje, state.config.tiempoExpiracionSesionMinutos])
  
  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    const now = new Date()
    setState(prev => {
      const updatedOrders = prev.orders.map(order => {
        if (order.id !== orderId) return order

        const updates: Partial<Order> = { status, updatedAt: now }

        if (status === 'preparando' && !order.tiempoInicioPreparacion) {
          updates.tiempoInicioPreparacion = now
        }
        if ((status === 'listo' || status === 'entregado') && !order.tiempoFinPreparacion) {
          updates.tiempoFinPreparacion = now
        }

        return { ...order, ...updates }
      })

      // Sync session.orders with updated orders
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

    // Persist to Supabase
    const payload: Record<string, unknown> = { status, updated_at: now.toISOString() }
    if (status === 'preparando') payload.tiempo_inicio_preparacion = now.toISOString()
    if (status === 'listo' || status === 'entregado') payload.tiempo_fin_preparacion = now.toISOString()
    supabase.from('orders').update(payload).eq('id', orderId).then(({ error }) => {
      if (error) console.error('Error actualizando status de pedido:', error)
    })
  }, [])
  
  const updateKitchenStatus = useCallback((orderId: string, kitchen: 'a' | 'b', status: KitchenStatus) => {
    // Capture the computed payload from inside the updater so we can persist it to Supabase
    let supabasePayload: Record<string, unknown> | null = null

    setState(prev => {
      const updatedOrders = prev.orders.map(order => {
        if (order.id !== orderId) return order

        const updates: Partial<Order> = { updatedAt: new Date() }

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

        const needsA = order.items.some(i => i.menuItem.cocina === 'cocina_a' || i.menuItem.cocina === 'ambas')
        const needsB = order.items.some(i => i.menuItem.cocina === 'cocina_b' || i.menuItem.cocina === 'ambas')

        const aReady = !needsA || newCocinaA === 'listo'
        const bReady = !needsB || newCocinaB === 'listo'

        if (aReady && bReady) {
          updates.status = 'listo'
          if (!order.tiempoFinPreparacion) updates.tiempoFinPreparacion = new Date()
        } else if (newCocinaA === 'preparando' || newCocinaB === 'preparando') {
          updates.status = 'preparando'
        }

        const newOrder = { ...order, ...updates }

        // Build Supabase payload from computed result
        supabasePayload = {
          cocina_a_status: newOrder.cocinaAStatus,
          cocina_b_status: newOrder.cocinaBStatus,
          status: newOrder.status,
          updated_at: newOrder.updatedAt.toISOString(),
        }
        if (newOrder.claimedByKitchen) supabasePayload.claimed_by_kitchen = newOrder.claimedByKitchen
        if (newOrder.tiempoInicioPreparacion) supabasePayload.tiempo_inicio_preparacion = newOrder.tiempoInicioPreparacion.toISOString()
        if (newOrder.tiempoFinPreparacion) supabasePayload.tiempo_fin_preparacion = newOrder.tiempoFinPreparacion.toISOString()

        return newOrder
      })

      // Sync session.orders with updated orders
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

    // Persist to Supabase (payload was captured synchronously inside the updater)
    if (supabasePayload) {
      supabase.from('orders').update(supabasePayload).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Error actualizando cocina status:', error)
      })
    }
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

    supabase.from('table_sessions').insert({
      id: session.id,
      mesa: session.mesa,
      activa: true,
      bill_status: 'abierta',
      subtotal: 0,
      impuestos: 0,
      propina: 0,
      descuento: 0,
      total: 0,
      payment_status: 'pendiente',
      device_id: session.deviceId,
      expires_at: session.expiresAt.toISOString(),
    }).then(({ error }) => {
      if (error) console.error('Error guardando sesión:', error)
    })

    return session
  }, [state.tableSessions, state.config.tiempoExpiracionSesionMinutos])
  
  const closeTableSession = useCallback((sessionId: string) => {
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session) return prev

      return {
        ...prev,
        orders: prev.orders.filter(o => o.mesa !== session.mesa),
        tableSessions: prev.tableSessions.map(s =>
          s.id === sessionId ? { ...s, activa: false, billStatus: 'cerrada' as BillStatus } : s
        ),
        qrTokens: prev.qrTokens.map(t =>
          t.mesa === session.mesa && t.activo ? { ...t, activo: false } : t
        ),
        currentTable: prev.currentTable === session.mesa ? null : prev.currentTable,
        currentSessionId: prev.currentSessionId === sessionId ? null : prev.currentSessionId,
        cart: prev.currentTable === session.mesa ? [] : prev.cart,
      }
    })

    supabase.from('table_sessions').update({ activa: false, bill_status: 'cerrada' }).eq('id', sessionId).then(({ error }) => {
      if (error) console.error('Error cerrando sesión:', error)
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
    let subtotal = 0, impuestos = 0, total = 0
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session) return prev
      subtotal = session.orders.reduce((sum, o) => sum + calculateOrderTotal(o.items), 0)
      impuestos = subtotal * (prev.config.impuestoPorcentaje / 100)
      total = subtotal + impuestos + session.propina - session.descuento
      return {
        ...prev,
        tableSessions: prev.tableSessions.map(s =>
          s.id === sessionId ? { ...s, subtotal, impuestos, total } : s
        ),
      }
    })
    supabase.from('table_sessions').update({ subtotal, impuestos, total }).eq('id', sessionId).then(({ error }) => {
      if (error) console.error('Error actualizando totales de sesión:', error)
    })
  }, [])
  
  const applyDiscount = useCallback((sessionId: string, descuento: number, motivo: string) => {
    let total = 0
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session || session.billStatus === 'pagada') return prev
      total = session.subtotal + session.impuestos + session.propina - descuento
      return {
        ...prev,
        tableSessions: prev.tableSessions.map(s =>
          s.id === sessionId ? { ...s, descuento, descuentoMotivo: motivo, total } : s
        ),
      }
    })
    supabase.from('table_sessions').update({ descuento, descuento_motivo: motivo, total }).eq('id', sessionId).then(({ error }) => {
      if (error) console.error('Error aplicando descuento:', error)
    })
  }, [])

  const setTipAmount = useCallback((sessionId: string, propina: number) => {
    let total = 0
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session || session.billStatus === 'pagada') return prev
      total = session.subtotal + session.impuestos + propina - session.descuento
      return {
        ...prev,
        tableSessions: prev.tableSessions.map(s =>
          s.id === sessionId ? { ...s, propina, total } : s
        ),
      }
    })
    supabase.from('table_sessions').update({ propina, total }).eq('id', sessionId).then(({ error }) => {
      if (error) console.error('Error aplicando propina:', error)
    })
  }, [])

  const requestPayment = useCallback((sessionId: string, method: PaymentMethod) => {
    setState(prev => ({
      ...prev,
      tableSessions: prev.tableSessions.map(s =>
        s.id === sessionId ? { ...s, paymentMethod: method, paymentStatus: 'solicitado' as PaymentStatus } : s
      ),
    }))
    supabase.from('table_sessions').update({ payment_method: method, payment_status: 'solicitado' }).eq('id', sessionId).then(({ error }) => {
      if (error) console.error('Error solicitando pago:', error)
    })
  }, [])

  const confirmPayment = useCallback((sessionId: string) => {
    setState(prev => {
      const session = prev.tableSessions.find(s => s.id === sessionId)
      if (!session) return prev
      return {
        ...prev,
        tableSessions: prev.tableSessions.filter(s => s.id !== sessionId),
        qrTokens: prev.qrTokens.map(t =>
          t.mesa === session.mesa && t.activo ? { ...t, activo: false } : t
        ),
        orders: prev.orders.filter(o => o.mesa !== session.mesa),
        waiterCalls: prev.waiterCalls.filter(c => c.mesa !== session.mesa || c.atendido),
        currentTable: prev.currentTable === session.mesa ? null : prev.currentTable,
        currentSessionId: prev.currentSessionId === sessionId ? null : prev.currentSessionId,
        cart: prev.currentTable === session.mesa ? [] : prev.cart,
      }
    })
    // Mark session as paid in DB (keep for history, just mark it)
    supabase.from('table_sessions').update({
      activa: false,
      bill_status: 'pagada',
      payment_status: 'pagado',
      paid_at: new Date().toISOString(),
    }).eq('id', sessionId).then(({ error }) => {
      if (error) console.error('Error confirmando pago:', error)
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

  const emergencyCloseTables = useCallback((tables: number[]) => {
    const mesasSet = new Set(tables)
    setState(prev => ({
      ...prev,
      tableSessions: prev.tableSessions.filter(s => !s.activa || !mesasSet.has(s.mesa)),
      orders: prev.orders.filter(o => !o.mesa || !mesasSet.has(o.mesa)),
      qrTokens: prev.qrTokens.map(t =>
        mesasSet.has(t.mesa) && t.activo ? { ...t, activo: false } : t
      ),
      waiterCalls: prev.waiterCalls.filter(c => !mesasSet.has(c.mesa) || c.atendido),
    }))
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
  const updateMenuItem = useCallback(
  async (itemId: string, updates: Partial<MenuItem>, imageFile?: File) => {

    let imageUrl: string | undefined = updates.imagen

    if (imageFile) {
      const uploaded = await uploadMenuImage(imageFile)
      if (uploaded) imageUrl = uploaded
    }

    const payload: any = {}

    if (updates.nombre !== undefined) payload.name = updates.nombre
    if (updates.descripcion !== undefined) payload.description = updates.descripcion
    if (updates.precio !== undefined) payload.price = updates.precio
    if (updates.disponible !== undefined) payload.available = updates.disponible
    if (updates.categoria !== undefined) payload.category_id = updates.categoria
    if (imageUrl !== undefined) payload.image = imageUrl

    const { error } = await supabase
      .from("menu_items")
      .update(payload)
      .eq("id", itemId)

    if (error) {
      console.error("Error actualizando platillo:", error)
      return
    }

    setState(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item =>
        item.id === itemId
          ? { ...item, ...updates, imagen: imageUrl ?? item.imagen }
          : item
      )
    }))
  },
  []
)
  
const addMenuItem = useCallback(
  async (item: Omit<MenuItem, "id">, imageFile?: File) => {

    let imageUrl = item.imagen ?? null

    if (imageFile) {
      imageUrl = await uploadMenuImage(imageFile)
    }

    const { data, error } = await supabase
      .from("menu_items")
      .insert([
        {
          name: item.nombre,
          description: item.descripcion,
          price: item.precio,
          available: item.disponible ?? true,
          image: imageUrl,
          category_id: item.categoria ?? null
        }
      ])
      .select()

    if (error) {
      console.error("Error creando platillo:", error)
      return
    }

    if (data) {
      const nuevo: MenuItem = {
        id: data[0].id,
        nombre: data[0].name,
        descripcion: data[0].description,
        precio: Number(data[0].price),
        categoria: data[0].category_id,
        disponible: data[0].available,
        imagen: data[0].image ?? undefined,
        cocina: "cocina_a"
      }

      setState(prev => ({
        ...prev,
        menuItems: [...prev.menuItems, nuevo]
      }))
    }
  },
  []
)

  const deleteMenuItem = useCallback(async (itemId: string) => {

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId)

  if (error) {
    console.error("Error eliminando platillo:", error)
    return
  }

  setState(prev => ({
    ...prev,
    menuItems: prev.menuItems.filter(item => item.id !== itemId)
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
  const addCategory = useCallback(async (nombre: string) => {

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name: nombre }])
    .select()

  if (error) {
    console.error("Error creando categoria:", error)
    return
  }

  if (data) {
    setState(prev => {
      const nueva: MenuCategory = {
        id: data[0].id,
        nombre: data[0].name,
        activa: true,
        orden: prev.categories.length + 1,
      }
      return { ...prev, categories: [...prev.categories, nueva] }
    })
  }

}, [])
  
  const updateCategory = useCallback(async (categoryId: string, updates: Partial<MenuCategory>) => {
    // Persist name changes to Supabase (only 'name' column exists in DB)
    if (updates.nombre !== undefined) {
      const { error } = await supabase
        .from("categories")
        .update({ name: updates.nombre })
        .eq("id", categoryId)

      if (error) {
        console.error("Error actualizando categoría:", error)
        return
      }
    }

    setState(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ),
    }))
  }, [])
  
  const deleteCategory = useCallback(async (categoryId: string) => {

  // 1️⃣ quitar categoria a los platillos
  await supabase
    .from("menu_items")
    .update({ category_id: null })
    .eq("category_id", categoryId)

  // 2️⃣ borrar categoria
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)

  if (error) {
    console.error("Error eliminando categoria:", error)
    return
  }

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
      const updatedMenuItems = prev.menuItems.map(item => {
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
        menuItems: updatedMenuItems,
      }
    })

    // Sync to Supabase
    const payload: Record<string, unknown> = {}
    if (updates.nombre !== undefined) payload.nombre = updates.nombre
    if (updates.categoria !== undefined) payload.categoria = updates.categoria
    if (updates.unidad !== undefined) payload.unidad = updates.unidad
    if (updates.stockActual !== undefined) payload.stock_actual = updates.stockActual
    if (updates.stockMinimo !== undefined) payload.stock_minimo = updates.stockMinimo
    if (updates.cantidadMaxima !== undefined) payload.cantidad_maxima = updates.cantidadMaxima
    if (updates.costoUnitario !== undefined) payload.costo_unitario = updates.costoUnitario
    if (updates.activo !== undefined) payload.activo = updates.activo
    if (Object.keys(payload).length > 0) {
      supabase.from('ingredients').update(payload).eq('id', ingredientId).then(({ error }) => {
        if (error) console.error('Error actualizando ingrediente:', error)
      })
    }
  }, [])

  const addIngredient = useCallback((ingredient: Omit<Ingredient, 'id'>) => {
    const newId = generateId()
    setState(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...ingredient, id: newId }],
    }))

    supabase.from('ingredients').insert([{
      id: newId,
      nombre: ingredient.nombre,
      categoria: ingredient.categoria,
      unidad: ingredient.unidad,
      stock_actual: ingredient.stockActual,
      stock_minimo: ingredient.stockMinimo,
      cantidad_maxima: ingredient.cantidadMaxima,
      costo_unitario: ingredient.costoUnitario,
      activo: ingredient.activo,
    }]).then(({ error }) => {
      if (error) console.error('Error creando ingrediente:', error)
    })
  }, [])

  const adjustInventory = useCallback((ingredientId: string, tipo: 'entrada' | 'salida' | 'merma' | 'ajuste', cantidad: number, motivo: string) => {
    const userId = state.currentUser?.id || 'system'
    const adjustment: InventoryAdjustment = {
      id: generateId(),
      ingredientId,
      tipo,
      cantidad,
      motivo,
      userId,
      createdAt: new Date(),
    }

    let newStock = 0
    setState(prev => {
      const newIngredients = prev.ingredients.map(ing => {
        if (ing.id !== ingredientId) return ing
        let stock = ing.stockActual
        if (tipo === 'entrada') stock += cantidad
        else if (tipo === 'ajuste') stock = cantidad
        else stock = Math.max(0, stock - cantidad)
        newStock = Math.round(stock * 100) / 100
        return { ...ing, stockActual: newStock }
      })
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

    // Persist adjustment + updated stock to Supabase
    supabase.from('inventory_adjustments').insert([{
      id: adjustment.id,
      ingredient_id: ingredientId,
      tipo,
      cantidad,
      motivo,
      user_id: userId === 'system' ? null : userId,
    }]).then(({ error }) => {
      if (error) console.error('Error guardando ajuste:', error)
    })
    supabase.from('ingredients').update({ stock_actual: newStock }).eq('id', ingredientId).then(({ error }) => {
      if (error) console.error('Error actualizando stock:', error)
    })
  }, [state.currentUser])
  
  const getLowStockIngredients = useCallback((): Ingredient[] => {
    return state.ingredients.filter(ing => ing.stockActual <= ing.stockMinimo)
  }, [state.ingredients])
  
  // ============ CONFIG ============
  const updateConfig = useCallback((updates: Partial<AppConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }))
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.impuestoPorcentaje !== undefined) payload.impuesto_porcentaje = updates.impuestoPorcentaje
    if (updates.propinaSugeridaPorcentaje !== undefined) payload.propina_sugerida_porcentaje = updates.propinaSugeridaPorcentaje
    if (updates.tiempoExpiracionSesionMinutos !== undefined) payload.tiempo_expiracion_sesion_minutos = updates.tiempoExpiracionSesionMinutos
    if (updates.zonasReparto !== undefined) payload.zonas_reparto = updates.zonasReparto
    if (updates.horariosOperacion !== undefined) payload.horarios_operacion = updates.horariosOperacion
    if (updates.metodospagoActivos !== undefined) payload.metodos_pago_activos = updates.metodospagoActivos
    if (updates.sonidoNuevosPedidos !== undefined) payload.sonido_nuevos_pedidos = updates.sonidoNuevosPedidos
    if (updates.notificacionesStockBajo !== undefined) payload.notificaciones_stock_bajo = updates.notificacionesStockBajo
    supabase.from('app_config').update(payload).eq('id', 'default').then(({ error }) => {
      if (error) console.error('Error guardando configuración:', error)
    })
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

    // Persist to Supabase
    supabase.from('orders').delete().eq('id', orderId).then(({ error }) => {
      if (error) console.error('Error eliminando pedido en Supabase:', error)
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

    supabase.from('refunds').insert({
      id: refund.id,
      order_id: refund.orderId,
      session_id: refund.sessionId ?? null,
      monto: refund.monto,
      motivo: refund.motivo,
      tipo: refund.tipo,
      items_reembolsados: refund.itemsReembolsados ?? null,
      inventario_revertido: refund.inventarioRevertido,
      user_id: refund.userId,
    }).then(({ error }) => {
      if (error) console.error('Error guardando reembolso:', error)
    })

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
  emergencyCloseTables,
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
