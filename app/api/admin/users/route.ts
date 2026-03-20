import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/admin/users — create a new user in Auth + profiles
export async function POST(req: NextRequest) {
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

  return NextResponse.json({ profile })
}

// PUT /api/admin/users — update nombre, role or activo
export async function PUT(req: NextRequest) {
  const { userId, updates } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  const profileUpdates: Record<string, unknown> = {}
  if (updates.nombre !== undefined) profileUpdates.nombre = updates.nombre
  if (updates.role !== undefined) profileUpdates.role = updates.role
  if (updates.activo !== undefined) profileUpdates.activo = updates.activo

  // When role changes, also update user_metadata so JWT stays in sync
  if (updates.role !== undefined) {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role: updates.role },
    })
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

  return NextResponse.json({ profile })
}

// DELETE /api/admin/users — delete auth user + profile
export async function DELETE(req: NextRequest) {
  const { userId } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  // Delete profile first (FK references auth.users)
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
