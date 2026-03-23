import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'

// 20 requests per minute per IP on admin user management
const RATE_LIMIT = { limit: 20, windowMs: 60_000 }

function getRateLimitKey(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  return `admin-users:${ip}`
}

function applyRateLimit(req: NextRequest): NextResponse | null {
  const result = checkRateLimit(getRateLimitKey(req), RATE_LIMIT)
  if (!result.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en un momento.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
    })
  }
  return null
}

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | { userId: string }> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) }
  }
  const role = user.user_metadata?.role
  if (role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acceso denegado: solo administradores' }, { status: 403 }) }
  }
  return { userId: user.id }
}

// POST /api/admin/users — create a new user in Auth + profiles
export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req)
  if (rl) return rl
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const { username, password, nombre, role } = await req.json()

  if (!username || !password || !nombre || !role) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `${username}@pqvv.local`,
    password,
    user_metadata: { role },
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: authData.user.id, username, nombre, role, activo: true })
    .select()
    .single()

  if (profileError) {
    // Rollback: remove the auth user we just created
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  await supabaseAdmin.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: auth.userId,
    accion: 'crear_usuario',
    detalles: `Usuario creado: ${username} (${role})`,
    entidad: 'profile',
    entidad_id: authData.user.id,
  })

  return NextResponse.json({ profile })
}

// PUT /api/admin/users — update nombre, role or activo
export async function PUT(req: NextRequest) {
  const rl = applyRateLimit(req)
  if (rl) return rl
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const { userId, updates } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  const profileUpdates: Record<string, unknown> = {}
  if (updates.nombre !== undefined) profileUpdates.nombre = updates.nombre
  if (updates.role !== undefined) profileUpdates.role = updates.role
  if (updates.activo !== undefined) profileUpdates.activo = updates.activo

  // Handle auth-level updates (password + role metadata)
  const authUpdates: Record<string, unknown> = {}
  if (updates.password) authUpdates.password = updates.password
  if (updates.role !== undefined) authUpdates.user_metadata = { role: updates.role }

  if (Object.keys(authUpdates).length > 0) {
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates)
    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 })
    }
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .update(profileUpdates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Audit log for role/activo changes
  if (updates.role !== undefined || updates.activo !== undefined) {
    const changeDesc = [
      updates.role !== undefined ? `rol → ${updates.role}` : null,
      updates.activo !== undefined ? `activo → ${updates.activo}` : null,
    ].filter(Boolean).join(', ')
    await supabaseAdmin.from('audit_logs').insert({
      id: crypto.randomUUID(),
      user_id: auth.userId,
      accion: 'actualizar_usuario',
      detalles: `Cambio en usuario ${userId}: ${changeDesc}`,
      entidad: 'profile',
      entidad_id: userId,
    })
  }

  return NextResponse.json({ profile })
}

// DELETE /api/admin/users — delete auth user + profile
export async function DELETE(req: NextRequest) {
  const rl = applyRateLimit(req)
  if (rl) return rl
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  const { userId } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  // Prevent self-deletion
  if (userId === auth.userId) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
  }

  // Delete profile first (FK references auth.users)
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await supabaseAdmin.from('audit_logs').insert({
    id: crypto.randomUUID(),
    user_id: auth.userId,
    accion: 'eliminar_usuario',
    detalles: `Usuario eliminado: ${userId}`,
    entidad: 'profile',
    entidad_id: userId,
  })

  return NextResponse.json({ ok: true })
}
