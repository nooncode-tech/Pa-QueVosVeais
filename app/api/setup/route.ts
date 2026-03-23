import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/setup
 * Creates the very first admin user.
 * Only works when the profiles table is completely empty.
 * After the first admin exists, this endpoint returns 403.
 */
export async function POST(req: NextRequest) {
  // Check if any profiles already exist
  const { count, error: countError } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    return NextResponse.json({ error: 'Error verificando la base de datos' }, { status: 500 })
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Ya existe al menos un usuario. Usa el panel de administración para agregar más.' },
      { status: 403 }
    )
  }

  const { username, password, nombre } = await req.json()

  if (!username?.trim() || !password?.trim() || !nombre?.trim()) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `${username.trim().toLowerCase()}@pqvv.local`,
    password: password.trim(),
    user_metadata: { role: 'admin' },
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Create profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      username: username.trim().toLowerCase(),
      nombre: nombre.trim(),
      role: 'admin',
      activo: true,
    })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

/**
 * GET /api/setup
 * Returns whether setup is needed (no users exist yet).
 */
export async function GET() {
  const { count } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({ needsSetup: (count ?? 0) === 0 })
}
