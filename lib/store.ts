// Store para Pa' Que Vos Veáis - Sistema de Pedidos
// Estado global usando React Context + localStorage para persistencia

export type Channel = 'mesa' | 'mesero' | 'para_llevar' | 'delivery'
export type Kitchen = 'cocina_a' | 'cocina_b' | 'ambas'
export type OrderStatus = 'recibido' | 'preparando' | 'listo' | 'empacado' | 'en_camino' | 'entregado' | 'cancelado'
export type CancelReason = 'cliente_solicito' | 'sin_ingredientes' | 'error_pedido' | 'tiempo_excedido' | 'otro'
export type KitchenStatus = 'en_cola' | 'preparando' | 'listo'
export type PaymentMethod = 'tarjeta' | 'efectivo' | 'transferencia' | 'apple_pay'
export type PaymentStatus = 'pendiente' | 'solicitado' | 'pagado' | 'reembolsado'
export type BillStatus = 'abierta' | 'cerrada' | 'pagada'
export type UserRole = 'admin' | 'mesero' | 'cocina_a' | 'cocina_b'
export type IngredientUnit = 'kg' | 'g' | 'l' | 'ml' | 'unidad' | 'porcion'

// ============ USUARIOS ============
export interface User {
  id: string
  username: string
  nombre: string
  role: UserRole
  activo: boolean
  createdAt: Date
}

// ============ INGREDIENTES E INVENTARIO ============
export type IngredientCategory = string

export const DEFAULT_INGREDIENT_CATEGORIES = ['Carnes', 'Verduras', 'Lacteos', 'Salsas', 'Tortillas', 'Bebidas', 'Otros']

export interface Ingredient {
  id: string
  nombre: string
  categoria: IngredientCategory
  unidad: IngredientUnit
  stockActual: number
  stockMinimo: number
  cantidadMaxima: number
  costoUnitario: number
  activo: boolean
}

export interface RecipeIngredient {
  ingredientId: string
  cantidad: number
}

export interface InventoryAdjustment {
  id: string
  ingredientId: string
  tipo: 'entrada' | 'salida' | 'merma' | 'ajuste'
  cantidad: number
  motivo: string
  userId: string
  createdAt: Date
}

// ============ MENÚ ============
export interface Extra {
  id: string
  nombre: string
  precio: number
  receta?: RecipeIngredient[]
}

export interface ModifierOption {
  id: string
  nombre: string       // "Bien cocido", "Salsa verde", etc.
  precioExtra: number  // 0 for most options
}

export interface ModifierGroup {
  id: string
  nombre: string             // "Término de cocción", "¿Con qué salsa?"
  requerido: boolean
  tipo: 'unico' | 'multiple' // radio vs checkbox
  opciones: ModifierOption[]
}

export interface SelectedModifier {
  grupoId: string
  grupoNombre: string
  opciones: Array<{ id: string; nombre: string; precioExtra: number }>
}

export type EtiquetaItem = 'vegano' | 'vegetariano' | 'sin-gluten' | 'picante' | 'muy-picante' | 'mariscos' | 'lacteos' | 'nueces' | 'sin-tacc'

export const ETIQUETAS_CONFIG: Record<EtiquetaItem, { label: string; emoji: string; color: string }> = {
  'vegano':       { label: 'Vegano',      emoji: '🌿', color: 'bg-green-100 text-green-800' },
  'vegetariano':  { label: 'Vegetariano', emoji: '🥦', color: 'bg-lime-100 text-lime-800' },
  'sin-gluten':   { label: 'Sin gluten',  emoji: '🌾', color: 'bg-yellow-100 text-yellow-800' },
  'sin-tacc':     { label: 'Sin TACC',    emoji: '✅', color: 'bg-yellow-100 text-yellow-800' },
  'picante':      { label: 'Picante',     emoji: '🌶️', color: 'bg-red-100 text-red-700' },
  'muy-picante':  { label: 'Muy picante', emoji: '🔥', color: 'bg-red-200 text-red-800' },
  'mariscos':     { label: 'Mariscos',    emoji: '🦐', color: 'bg-blue-100 text-blue-800' },
  'lacteos':      { label: 'Lácteos',     emoji: '🥛', color: 'bg-sky-100 text-sky-800' },
  'nueces':       { label: 'Nueces',      emoji: '🥜', color: 'bg-amber-100 text-amber-800' },
}

export interface MenuItem {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen?: string
  cocina: Kitchen
  disponible: boolean
  extras?: Extra[]
  receta?: RecipeIngredient[]
  gruposModificadores?: ModifierGroup[]
  etiquetas?: EtiquetaItem[]
  orden?: number
  horarioDisponible?: { inicio: string; fin: string }
}

// ============ PEDIDOS ============
export interface OrderItem {
  id: string
  menuItem: MenuItem
  cantidad: number
  notas?: string
  extras?: Extra[]
  modificadores?: SelectedModifier[]
  cocinaAStatus?: KitchenStatus
  cocinaBStatus?: KitchenStatus
}

export interface Order {
  id: string
  numero: number
  canal: Channel
  mesa?: number
  items: OrderItem[]
  status: OrderStatus
  cocinaAStatus: KitchenStatus
  cocinaBStatus: KitchenStatus
  createdAt: Date
  updatedAt: Date
  // Para delivery/para llevar
  nombreCliente?: string
  telefono?: string
  direccion?: string
  zonaReparto?: string
  costoEnvio?: number
  repartidorId?: string
  // Tiempos
  tiempoInicioPreparacion?: Date
  tiempoFinPreparacion?: Date
  // Kitchen claim for "ambas" orders
  claimedByKitchen?: 'cocina_a' | 'cocina_b'
  // Cancelacion
  cancelado?: boolean
  cancelReason?: CancelReason
  cancelMotivo?: string
  canceladoPor?: string
  canceladoAt?: Date
}

// ============ SESIONES DE MESA Y QR ============
export interface TableSession {
  id: string
  mesa: number
  activa: boolean
  orders: Order[]
  createdAt: Date
  expiresAt: Date
  deviceId: string
  // Cuenta
  billStatus: BillStatus
  subtotal: number
  impuestos: number
  propina: number
  descuento: number
  descuentoMotivo?: string
  total: number
  paymentMethod?: PaymentMethod
  paymentStatus: PaymentStatus
  paidAt?: Date
  receiptId?: string
  feedbackDone?: boolean
}
// ============ COBROS / VENTAS ============
export interface Payment {
  id: string
  sessionId: string
  mesa: number
  subtotal: number
  impuestos: number
  propina: number
  total: number
  metodo: PaymentMethod
  userId: string
  createdAt: Date
}

// ============ LLAMADAS DE MESERO ============
export interface WaiterCall {
  id: string
  mesa: number
  tipo: 'atencion' | 'cuenta' | 'otro'
  mensaje?: string
  atendido: boolean
  atendidoPor?: string
  createdAt: Date
  atendidoAt?: Date
}

// ============ RECOMPENSAS Y DESCUENTOS ============
export interface Reward {
  id: string
  nombre: string
  descripcion: string
  tipo: 'porcentaje' | 'monto_fijo'
  valor: number
  accion: 'seguir_instagram' | 'primera_visita' | 'cumpleanos' | 'referido'
  activo: boolean
  usosMaximos?: number
}

export interface AppliedReward {
  id: string
  sessionId: string
  rewardId: string
  descuento: number
  createdAt: Date
}

// ============ PROMOCIONES ============
export interface Promocion {
  id: string
  titulo: string
  descripcion: string
  tipo: 'porcentaje' | 'monto_fijo'
  valor: number
  activa: boolean
  fechaInicio?: string
  fechaFin?: string
  color: string
  createdAt: Date
}

// ============ CONFIGURACIÓN ============
export interface AppConfig {
  impuestoPorcentaje: number
  propinaSugeridaPorcentaje: number
  tiempoExpiracionSesionMinutos: number
  zonasReparto: string[]
  horariosOperacion: { dia: number; inicio: string; fin: string }[]
  metodospagoActivos: {
    efectivo: boolean
    tarjeta: boolean
    transferencia: boolean
    apple_pay: boolean
  }
  sonidoNuevosPedidos: boolean
  notificacionesStockBajo: boolean
  autoPrintComanda: boolean
  googleReviewUrl: string
}

// ============ QR TOKENS ============
export interface QRToken {
  id: string
  mesa: number
  token: string
  createdAt: Date
  expiresAt: Date
  usedAt?: Date
  sessionId?: string
  activo: boolean
}

// ============ REEMBOLSOS ============
export interface Refund {
  id: string
  orderId: string
  sessionId?: string
  monto: number
  motivo: string
  tipo: 'total' | 'parcial'
  itemsReembolsados?: string[] // IDs de items
  inventarioRevertido: boolean
  userId: string
  createdAt: Date
}

// ============ AUDITORÍA ============
export interface AuditLog {
  id: string
  userId: string
  accion: string
  detalles: string
  entidad: string
  entidadId: string
  createdAt: Date
}

// ============ REPORTES ============
export interface DailySales {
  fecha: string
  totalVentas: number
  totalPedidos: number
  ticketPromedio: number
  ventasPorCategoria: Record<string, number>
  ventasPorPlatillo: Record<string, number>
  tiempoPromedioPreparacion: number
}

// Menú real basado en Pa' Que Vos Veáis
export const MENU_ITEMS: MenuItem[] = [
  // Tacos
  {
    id: 'taco-pastor',
    nombre: 'Taco al Pastor',
    descripcion: 'Cerdo marinado con achiote, piña, cebolla y cilantro',
    precio: 35,
    categoria: 'cat-1',
    cocina: 'cocina_a',
    disponible: true,
    orden: 1,
    extras: [
      { id: 'extra-queso', nombre: 'Extra queso', precio: 15 },
      { id: 'extra-guacamole', nombre: 'Guacamole', precio: 20 },
    ],
    receta: [
      { ingredientId: 'ing-cerdo', cantidad: 0.1 },
      { ingredientId: 'ing-tortilla', cantidad: 2 },
      { ingredientId: 'ing-pina', cantidad: 0.02 },
      { ingredientId: 'ing-cebolla', cantidad: 0.02 },
      { ingredientId: 'ing-cilantro', cantidad: 0.01 },
    ],
  },
  {
    id: 'taco-bistec',
    nombre: 'Taco de Bistec',
    descripcion: 'Bistec de res a la plancha con cebolla y cilantro',
    precio: 40,
    categoria: 'cat-1',
    cocina: 'cocina_a',
    disponible: true,
    orden: 2,
    extras: [
      { id: 'extra-queso', nombre: 'Extra queso', precio: 15 },
      { id: 'extra-guacamole', nombre: 'Guacamole', precio: 20 },
    ],
    receta: [
      { ingredientId: 'ing-res', cantidad: 0.12 },
      { ingredientId: 'ing-tortilla', cantidad: 2 },
      { ingredientId: 'ing-cebolla', cantidad: 0.02 },
      { ingredientId: 'ing-cilantro', cantidad: 0.01 },
    ],
  },
  {
    id: 'taco-carnitas',
    nombre: 'Taco de Carnitas',
    descripcion: 'Cerdo confitado al estilo Michoacán',
    precio: 38,
    categoria: 'cat-1',
    cocina: 'cocina_a',
    disponible: true,
    orden: 3,
    receta: [
      { ingredientId: 'ing-cerdo', cantidad: 0.1 },
      { ingredientId: 'ing-tortilla', cantidad: 2 },
    ],
  },
  {
    id: 'taco-suadero',
    nombre: 'Taco de Suadero',
    descripcion: 'Carne de res suave y jugosa',
    precio: 38,
    categoria: 'cat-1',
    cocina: 'cocina_a',
    disponible: true,
    orden: 4,
    receta: [
      { ingredientId: 'ing-suadero', cantidad: 0.1 },
      { ingredientId: 'ing-tortilla', cantidad: 2 },
    ],
  },
  {
    id: 'taco-chorizo',
    nombre: 'Taco de Chorizo',
    descripcion: 'Chorizo artesanal con papas',
    precio: 35,
    categoria: 'cat-1',
    cocina: 'cocina_a',
    disponible: true,
    orden: 5,
    receta: [
      { ingredientId: 'ing-chorizo', cantidad: 0.08 },
      { ingredientId: 'ing-tortilla', cantidad: 2 },
      { ingredientId: 'ing-papa', cantidad: 0.03 },
    ],
  },
  // Antojitos
  {
    id: 'quesadilla-flor',
    nombre: 'Quesadilla de Flor de Calabaza',
    descripcion: 'Tortilla de maíz con queso Oaxaca y flor de calabaza',
    precio: 55,
    categoria: 'cat-2',
    cocina: 'cocina_b',
    disponible: true,
    orden: 1,
    receta: [
      { ingredientId: 'ing-tortilla-grande', cantidad: 1 },
      { ingredientId: 'ing-queso-oaxaca', cantidad: 0.05 },
      { ingredientId: 'ing-flor-calabaza', cantidad: 0.03 },
    ],
  },
  {
    id: 'quesadilla-huitlacoche',
    nombre: 'Quesadilla de Huitlacoche',
    descripcion: 'Tortilla de maíz con queso Oaxaca y huitlacoche',
    precio: 60,
    categoria: 'cat-2',
    cocina: 'cocina_b',
    disponible: true,
    orden: 2,
    receta: [
      { ingredientId: 'ing-tortilla-grande', cantidad: 1 },
      { ingredientId: 'ing-queso-oaxaca', cantidad: 0.05 },
      { ingredientId: 'ing-huitlacoche', cantidad: 0.04 },
    ],
  },
  {
    id: 'sope-chorizo',
    nombre: 'Sope de Chorizo',
    descripcion: 'Base de masa con frijoles, chorizo, crema y queso',
    precio: 50,
    categoria: 'cat-2',
    cocina: 'cocina_b',
    disponible: true,
    orden: 3,
    receta: [
      { ingredientId: 'ing-masa', cantidad: 0.08 },
      { ingredientId: 'ing-frijol', cantidad: 0.03 },
      { ingredientId: 'ing-chorizo', cantidad: 0.05 },
      { ingredientId: 'ing-crema', cantidad: 0.02 },
      { ingredientId: 'ing-queso-fresco', cantidad: 0.02 },
    ],
  },
  {
    id: 'sope-tinga',
    nombre: 'Sope de Tinga',
    descripcion: 'Base de masa con frijoles, tinga de pollo, crema y queso',
    precio: 50,
    categoria: 'cat-2',
    cocina: 'cocina_b',
    disponible: true,
    orden: 4,
    receta: [
      { ingredientId: 'ing-masa', cantidad: 0.08 },
      { ingredientId: 'ing-frijol', cantidad: 0.03 },
      { ingredientId: 'ing-pollo', cantidad: 0.05 },
      { ingredientId: 'ing-crema', cantidad: 0.02 },
    ],
  },
  {
    id: 'tlacoyos',
    nombre: 'Tlacoyos de Frijol',
    descripcion: 'Masa rellena de frijol negro con nopales y queso',
    precio: 45,
    categoria: 'cat-2',
    cocina: 'cocina_b',
    disponible: true,
    orden: 5,
    receta: [
      { ingredientId: 'ing-masa', cantidad: 0.1 },
      { ingredientId: 'ing-frijol', cantidad: 0.04 },
      { ingredientId: 'ing-nopal', cantidad: 0.03 },
      { ingredientId: 'ing-queso-fresco', cantidad: 0.02 },
    ],
  },
  {
    id: 'gorditas',
    nombre: 'Gorditas de Chicharrón',
    descripcion: 'Masa de maíz rellena de chicharrón prensado',
    precio: 48,
    categoria: 'cat-2',
    cocina: 'cocina_b',
    disponible: true,
    orden: 6,
    receta: [
      { ingredientId: 'ing-masa', cantidad: 0.1 },
      { ingredientId: 'ing-chicharron', cantidad: 0.04 },
    ],
  },
  // Bebidas
  {
    id: 'agua-horchata',
    nombre: 'Agua de Horchata',
    descripcion: 'Bebida tradicional de arroz con canela',
    precio: 35,
    categoria: 'cat-3',
    cocina: 'ambas',
    disponible: true,
    orden: 1,
  },
  {
    id: 'agua-jamaica',
    nombre: 'Agua de Jamaica',
    descripcion: 'Infusión de flor de jamaica',
    precio: 35,
    categoria: 'cat-3',
    cocina: 'ambas',
    disponible: true,
    orden: 2,
  },
  {
    id: 'agua-tamarindo',
    nombre: 'Agua de Tamarindo',
    descripcion: 'Bebida de tamarindo natural',
    precio: 35,
    categoria: 'cat-3',
    cocina: 'ambas',
    disponible: true,
    orden: 3,
  },
  {
    id: 'refresco',
    nombre: 'Refresco',
    descripcion: 'Coca-Cola, Sprite, Fanta',
    precio: 30,
    categoria: 'cat-3',
    cocina: 'ambas',
    disponible: true,
    orden: 4,
  },
  {
    id: 'cerveza',
    nombre: 'Cerveza',
    descripcion: 'Corona, Victoria, Modelo',
    precio: 45,
    categoria: 'cat-3',
    cocina: 'ambas',
    disponible: true,
    orden: 5,
  },
  // Postres
  {
    id: 'flan',
    nombre: 'Flan Napolitano',
    descripcion: 'Flan casero con caramelo',
    precio: 45,
    categoria: 'cat-4',
    cocina: 'cocina_b',
    disponible: true,
    orden: 1,
  },
  {
    id: 'churros',
    nombre: 'Churros con Chocolate',
    descripcion: '3 churros con chocolate caliente',
    precio: 50,
    categoria: 'cat-4',
    cocina: 'cocina_b',
    disponible: true,
    orden: 2,
  },
]


// ============ CATEGORIAS EDITABLES ============
export interface MenuCategory {
  id: string
  nombre: string
  orden: number
  activa: boolean
}

export const DEFAULT_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', nombre: 'Tacos', orden: 1, activa: true },
  { id: 'cat-2', nombre: 'Antojitos', orden: 2, activa: true },
  { id: 'cat-3', nombre: 'Bebidas', orden: 3, activa: true },
  { id: 'cat-4', nombre: 'Postres', orden: 4, activa: true },
]

// ============ MESAS CONFIGURABLES ============
export interface TableConfig {
  id: string
  numero: number
  nombre?: string
  capacidad: number
  activa: boolean
  ubicacion?: string
  createdAt: Date
}

export const DEFAULT_TABLES: TableConfig[] = Array.from({ length: 12 }, (_, i) => ({
  id: `table-${i + 1}`,
  numero: i + 1,
  capacidad: 4,
  activa: true,
  createdAt: new Date(),
}))

// Ingredientes iniciales
export const DEFAULT_INGREDIENTS: Ingredient[] = [
  { id: 'ing-cerdo', nombre: 'Cerdo (Pastor/Carnitas)', categoria: 'Carnes', unidad: 'kg', stockActual: 15, stockMinimo: 5, cantidadMaxima: 25, costoUnitario: 120, activo: true },
  { id: 'ing-res', nombre: 'Res (Bistec)', categoria: 'Carnes', unidad: 'kg', stockActual: 10, stockMinimo: 3, cantidadMaxima: 20, costoUnitario: 180, activo: true },
  { id: 'ing-suadero', nombre: 'Suadero', categoria: 'Carnes', unidad: 'kg', stockActual: 8, stockMinimo: 2, cantidadMaxima: 15, costoUnitario: 150, activo: true },
  { id: 'ing-chorizo', nombre: 'Chorizo', categoria: 'Carnes', unidad: 'kg', stockActual: 5, stockMinimo: 2, cantidadMaxima: 10, costoUnitario: 100, activo: true },
  { id: 'ing-pollo', nombre: 'Pollo (Tinga)', categoria: 'Carnes', unidad: 'kg', stockActual: 8, stockMinimo: 2, cantidadMaxima: 15, costoUnitario: 90, activo: true },
  { id: 'ing-tortilla', nombre: 'Tortilla Pequeña', categoria: 'Tortillas', unidad: 'unidad', stockActual: 500, stockMinimo: 100, cantidadMaxima: 800, costoUnitario: 1, activo: true },
  { id: 'ing-tortilla-grande', nombre: 'Tortilla Grande', categoria: 'Tortillas', unidad: 'unidad', stockActual: 200, stockMinimo: 50, cantidadMaxima: 400, costoUnitario: 3, activo: true },
  { id: 'ing-masa', nombre: 'Masa de Maiz', categoria: 'Tortillas', unidad: 'kg', stockActual: 20, stockMinimo: 5, cantidadMaxima: 30, costoUnitario: 25, activo: true },
  { id: 'ing-queso-oaxaca', nombre: 'Queso Oaxaca', categoria: 'Lacteos', unidad: 'kg', stockActual: 5, stockMinimo: 1, cantidadMaxima: 10, costoUnitario: 150, activo: true },
  { id: 'ing-queso-fresco', nombre: 'Queso Fresco', categoria: 'Lacteos', unidad: 'kg', stockActual: 3, stockMinimo: 1, cantidadMaxima: 8, costoUnitario: 100, activo: true },
  { id: 'ing-crema', nombre: 'Crema', categoria: 'Lacteos', unidad: 'l', stockActual: 5, stockMinimo: 1, cantidadMaxima: 10, costoUnitario: 60, activo: true },
  { id: 'ing-frijol', nombre: 'Frijol Cocido', categoria: 'Otros', unidad: 'kg', stockActual: 10, stockMinimo: 3, cantidadMaxima: 20, costoUnitario: 30, activo: true },
  { id: 'ing-flor-calabaza', nombre: 'Flor de Calabaza', categoria: 'Verduras', unidad: 'kg', stockActual: 2, stockMinimo: 0.5, cantidadMaxima: 5, costoUnitario: 80, activo: true },
  { id: 'ing-huitlacoche', nombre: 'Huitlacoche', categoria: 'Verduras', unidad: 'kg', stockActual: 1.5, stockMinimo: 0.5, cantidadMaxima: 4, costoUnitario: 200, activo: true },
  { id: 'ing-nopal', nombre: 'Nopal', categoria: 'Verduras', unidad: 'kg', stockActual: 5, stockMinimo: 1, cantidadMaxima: 10, costoUnitario: 30, activo: true },
  { id: 'ing-chicharron', nombre: 'Chicharron Prensado', categoria: 'Carnes', unidad: 'kg', stockActual: 3, stockMinimo: 1, cantidadMaxima: 8, costoUnitario: 120, activo: true },
  { id: 'ing-pina', nombre: 'Pina', categoria: 'Verduras', unidad: 'kg', stockActual: 5, stockMinimo: 1, cantidadMaxima: 10, costoUnitario: 25, activo: true },
  { id: 'ing-cebolla', nombre: 'Cebolla', categoria: 'Verduras', unidad: 'kg', stockActual: 10, stockMinimo: 2, cantidadMaxima: 15, costoUnitario: 20, activo: true },
  { id: 'ing-cilantro', nombre: 'Cilantro', categoria: 'Verduras', unidad: 'kg', stockActual: 2, stockMinimo: 0.5, cantidadMaxima: 5, costoUnitario: 40, activo: true },
  { id: 'ing-papa', nombre: 'Papa', categoria: 'Verduras', unidad: 'kg', stockActual: 10, stockMinimo: 2, cantidadMaxima: 20, costoUnitario: 15, activo: true },
]

// Usuarios por defecto (simulados)
// Users are now managed in Supabase Auth + profiles table.
// This array is used as a fallback only (no passwords stored).
export const DEFAULT_USERS: User[] = []

// Recompensas por defecto
export const DEFAULT_REWARDS: Reward[] = [
  { id: 'reward-instagram', nombre: 'Síguenos en Instagram', descripcion: '10% de descuento al seguirnos', tipo: 'porcentaje', valor: 10, accion: 'seguir_instagram', activo: true, usosMaximos: 1 },
  { id: 'reward-primera', nombre: 'Primera Visita', descripcion: '5% de descuento en tu primera visita', tipo: 'porcentaje', valor: 5, accion: 'primera_visita', activo: true, usosMaximos: 1 },
]

// Configuración por defecto
export const DEFAULT_CONFIG: AppConfig = {
  impuestoPorcentaje: 16,
  propinaSugeridaPorcentaje: 15,
  tiempoExpiracionSesionMinutos: 180,
  zonasReparto: ['Centro', 'Roma', 'Condesa', 'Juárez', 'Polanco', 'Del Valle'],
  horariosOperacion: [
    { dia: 0, inicio: '12:00', fin: '22:00' },
    { dia: 1, inicio: '12:00', fin: '22:00' },
    { dia: 2, inicio: '12:00', fin: '22:00' },
    { dia: 3, inicio: '12:00', fin: '22:00' },
    { dia: 4, inicio: '12:00', fin: '23:00' },
    { dia: 5, inicio: '12:00', fin: '23:00' },
    { dia: 6, inicio: '12:00', fin: '22:00' },
  ],
  metodospagoActivos: {
    efectivo: true,
    tarjeta: true,
    transferencia: true,
    apple_pay: false,
  },
  sonidoNuevosPedidos: true,
  notificacionesStockBajo: true,
  autoPrintComanda: false,
  googleReviewUrl: '',
}

// Funciones de utilidad
export function generateOrderNumber(): number {
  const today = new Date().toDateString()
  const storedDate = localStorage.getItem('orderDate')
  let counter = parseInt(localStorage.getItem('orderCounter') || '0')
  
  if (storedDate !== today) {
    counter = 0
    localStorage.setItem('orderDate', today)
  }
  
  counter++
  localStorage.setItem('orderCounter', counter.toString())
  return counter
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

export function generateDeviceId(): string {
  let deviceId = localStorage.getItem('deviceId')
  if (!deviceId) {
    deviceId = 'device-' + generateId()
    localStorage.setItem('deviceId', deviceId)
  }
  return deviceId
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getTimeDiff(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000 / 60)
  if (diff < 1) return 'Ahora'
  if (diff === 1) return '1 min'
  return `${diff} min`
}

export function getTimeDiffMinutes(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 1000 / 60)
}

export function getChannelLabel(canal: Channel): string {
  const labels: Record<Channel, string> = {
    mesa: 'Mesa',
    mesero: 'Mesero',
    para_llevar: 'Para llevar',
    delivery: 'Delivery',
  }
  return labels[canal]
}

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    recibido: 'Recibido',
    preparando: 'Preparando',
    listo: 'Listo',
    empacado: 'Empacado',
    en_camino: 'En camino',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }
  return labels[status]
}

export function getKitchenStatusLabel(status: KitchenStatus): string {
  const labels: Record<KitchenStatus, string> = {
    en_cola: 'En cola',
    preparando: 'Preparando',
    listo: 'Listo',
  }
  return labels[status]
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrador',
    mesero: 'Mesero / Atención',
    cocina_a: 'Cocina A',
    cocina_b: 'Cocina B',
  }
  return labels[role]
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    tarjeta: 'Tarjeta',
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    apple_pay: 'Apple Pay',
  }
  return labels[method]
}

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
    const modTotal = item.modificadores?.reduce(
      (m, mg) => m + mg.opciones.reduce((o, op) => o + op.precioExtra, 0), 0
    ) || 0
    return sum + (item.menuItem.precio + extrasTotal + modTotal) * item.cantidad
  }, 0)
}

export function canPrepareItem(item: MenuItem, ingredients: Ingredient[]): { canPrepare: boolean; maxPortions: number } {
  if (!item.receta || item.receta.length === 0) {
    return { canPrepare: true, maxPortions: 999 }
  }
  
  let maxPortions = Infinity
  
  for (const recipeIng of item.receta) {
    const ingredient = ingredients.find(i => i.id === recipeIng.ingredientId)
    if (!ingredient) {
      return { canPrepare: false, maxPortions: 0 }
    }
    
    const portions = Math.floor(ingredient.stockActual / recipeIng.cantidad)
    maxPortions = Math.min(maxPortions, portions)
  }
  
  return { 
    canPrepare: maxPortions > 0, 
    maxPortions: maxPortions === Infinity ? 999 : maxPortions 
  }
}

export function deductIngredients(item: MenuItem, cantidad: number, ingredients: Ingredient[], selectedExtras?: Extra[]): Ingredient[] {
  let result = [...ingredients]
  
  // Deduct main recipe ingredients
  if (item.receta) {
    result = result.map(ing => {
      const recipeIng = item.receta?.find(r => r.ingredientId === ing.id)
      if (recipeIng) {
        return {
          ...ing,
  stockActual: Math.round(Math.max(0, ing.stockActual - (recipeIng.cantidad * cantidad)) * 100) / 100,
  }
  }
  return ing
  })
  }
  
  // Deduct extras' recipe ingredients
  if (selectedExtras && selectedExtras.length > 0) {
    for (const extra of selectedExtras) {
      if (extra.receta && extra.receta.length > 0) {
        result = result.map(ing => {
          const recipeIng = extra.receta?.find(r => r.ingredientId === ing.id)
          if (recipeIng) {
            return {
              ...ing,
              stockActual: Math.round(Math.max(0, ing.stockActual - (recipeIng.cantidad * cantidad)) * 100) / 100,
            }
          }
          return ing
        })
      }
    }
  }
  
  return result
}

// ============ QR TOKEN FUNCTIONS ============
export function generateQRToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export function createQRToken(mesa: number, expirationMinutes: number = 180): QRToken {
  return {
    id: generateId(),
    mesa,
    token: generateQRToken(),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
    activo: true,
  }
}

export function validateQRToken(token: string, tokens: QRToken[]): QRToken | null {
  const qrToken = tokens.find(t => t.token === token && t.activo)
  if (!qrToken) return null
  
  if (new Date(qrToken.expiresAt) < new Date()) {
    return null // Token expired
  }
  
  return qrToken
}

export function generateQRUrl(baseUrl: string, mesa: number, token: string): string {
  return `${baseUrl}?mesa=${mesa}&token=${token}`
}

// ============ REEMBOLSO FUNCTIONS ============
export function restoreIngredients(item: MenuItem, cantidad: number, ingredients: Ingredient[], selectedExtras?: Extra[]): Ingredient[] {
  let result = [...ingredients]
  
  if (item.receta) {
    result = result.map(ing => {
      const recipeIng = item.receta?.find(r => r.ingredientId === ing.id)
      if (recipeIng) {
        return {
          ...ing,
  stockActual: Math.round((ing.stockActual + (recipeIng.cantidad * cantidad)) * 100) / 100,
  }
  }
  return ing
  })
  }
  
  // Restore extras' recipe ingredients
  if (selectedExtras && selectedExtras.length > 0) {
    for (const extra of selectedExtras) {
      if (extra.receta && extra.receta.length > 0) {
        result = result.map(ing => {
          const recipeIng = extra.receta?.find(r => r.ingredientId === ing.id)
          if (recipeIng) {
            return {
              ...ing,
              stockActual: Math.round((ing.stockActual + (recipeIng.cantidad * cantidad)) * 100) / 100,
            }
          }
          return ing
        })
      }
    }
  }
  
  return result
}

export function getCancelReasonLabel(reason: CancelReason): string {
  const labels: Record<CancelReason, string> = {
    cliente_solicito: 'El cliente lo solicito',
    sin_ingredientes: 'Sin ingredientes disponibles',
    error_pedido: 'Error en el pedido',
    tiempo_excedido: 'Tiempo de espera excedido',
    otro: 'Otro motivo',
  }
  return labels[reason]
}

// ============ DELIVERY ZONE FUNCTIONS ============
export interface DeliveryZone {
  nombre: string
  costoEnvio: number
  tiempoEstimado: number // minutos
  activa: boolean
}

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { nombre: 'Centro', costoEnvio: 25, tiempoEstimado: 20, activa: true },
  { nombre: 'Roma', costoEnvio: 30, tiempoEstimado: 25, activa: true },
  { nombre: 'Condesa', costoEnvio: 30, tiempoEstimado: 25, activa: true },
  { nombre: 'Juarez', costoEnvio: 35, tiempoEstimado: 30, activa: true },
  { nombre: 'Polanco', costoEnvio: 45, tiempoEstimado: 35, activa: true },
  { nombre: 'Del Valle', costoEnvio: 40, tiempoEstimado: 35, activa: true },
  { nombre: 'Coyoacan', costoEnvio: 50, tiempoEstimado: 40, activa: true },
  { nombre: 'Santa Fe', costoEnvio: 60, tiempoEstimado: 45, activa: false },
]

export function getDeliveryZoneCost(zonaNombre: string, zones: DeliveryZone[]): number {
  const zone = zones.find(z => z.nombre === zonaNombre && z.activa)
  return zone?.costoEnvio || 0
}
