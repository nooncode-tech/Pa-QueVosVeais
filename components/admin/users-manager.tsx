'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Shield, ChefHat, UserCheck, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { useApp } from '@/lib/context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserRole } from '@/lib/store'

interface Profile {
  id: string
  username: string
  nombre: string
  role: UserRole
  activo: boolean
  created_at: string
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin:    { label: 'Administrador', icon: <Shield className="h-3.5 w-3.5" />,  color: 'bg-primary text-primary-foreground' },
  mesero:   { label: 'Mesero',        icon: <UserCheck className="h-3.5 w-3.5" />, color: 'bg-amber-500 text-white' },
  cocina_a: { label: 'Cocina A',      icon: <ChefHat className="h-3.5 w-3.5" />,  color: 'bg-success text-success-foreground' },
  cocina_b: { label: 'Cocina B',      icon: <ChefHat className="h-3.5 w-3.5" />,  color: 'bg-blue-500 text-white' },
}

export function UsersManager() {
  const { currentUser } = useApp()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)

  const loadProfiles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at')
    if (!error && data) setProfiles(data as Profile[])
    setLoading(false)
  }

  useEffect(() => { loadProfiles() }, [])

  const handleToggleActive = async (profile: Profile) => {
    if (profile.id === currentUser?.id) return

    // Optimistic update
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, activo: !p.activo } : p))

    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.id, updates: { activo: !profile.activo } }),
    })
    if (!res.ok) {
      // Revert on failure
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, activo: profile.activo } : p))
    }
  }

  const handleCreate = async (data: { username: string; password: string; nombre: string; role: UserRole }) => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (res.ok) { await loadProfiles(); return null }
    return json.error as string
  }

  const handleUpdate = async (userId: string, updates: Partial<Profile>) => {
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates }),
    })
    const json = await res.json()
    if (res.ok) { await loadProfiles(); return null }
    return json.error as string
  }

  const handleDelete = async (userId: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) { await loadProfiles(); return null }
    const json = await res.json()
    return json.error as string
  }

  return (
    <div className="p-3">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => {
          const count = profiles.filter(p => p.role === role && p.activo).length
          return (
            <Card key={role} className="bg-secondary/50">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-foreground">{count}</p>
                <p className="text-[9px] text-muted-foreground truncate">{ROLE_CONFIG[role].label}s</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-foreground">Gestión de usuarios</h2>
          <p className="text-[10px] text-muted-foreground">
            {profiles.filter(p => p.activo).length} usuario{profiles.filter(p => p.activo).length !== 1 ? 's' : ''} activo{profiles.filter(p => p.activo).length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={loadProfiles} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="bg-primary text-primary-foreground h-7 text-[10px] px-2.5" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-1.5">
          {profiles.map((profile) => {
            const roleConfig = ROLE_CONFIG[profile.role]
            const isCurrentUser = profile.id === currentUser?.id

            return (
              <Card
                key={profile.id}
                className={`border ${!profile.activo ? 'opacity-50' : ''} ${isCurrentUser ? 'border-primary' : ''}`}
              >
                <CardContent className="p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${roleConfig.color} flex items-center justify-center`}>
                        {roleConfig.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-medium text-xs text-foreground">{profile.nombre}</h4>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1">Tu</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">@{profile.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] h-4 ${roleConfig.color}`}>
                        {roleConfig.label}
                      </Badge>
                      <Switch
                        checked={profile.activo}
                        onCheckedChange={() => handleToggleActive(profile)}
                        disabled={isCurrentUser}
                        className="scale-[0.6]"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingProfile(profile)}
                        className="h-6 w-6"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Dialog */}
      {showAddDialog && (
        <UserDialog
          user={null}
          onClose={() => setShowAddDialog(false)}
          onSave={async (data) => {
            const err = await handleCreate(data as { username: string; password: string; nombre: string; role: UserRole })
            if (!err) setShowAddDialog(false)
            return err
          }}
        />
      )}

      {/* Edit Dialog */}
      {editingProfile && (
        <UserDialog
          user={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={async (data) => {
            const err = await handleUpdate(editingProfile.id, data)
            if (!err) setEditingProfile(null)
            return err
          }}
          onDelete={editingProfile.id !== currentUser?.id ? async () => {
            const err = await handleDelete(editingProfile.id)
            if (!err) setEditingProfile(null)
            return err
          } : undefined}
        />
      )}
    </div>
  )
}

interface UserDialogProps {
  user: Profile | null
  onClose: () => void
  onSave: (data: Partial<Profile> & { password?: string }) => Promise<string | null>
  onDelete?: () => Promise<string | null>
}

function UserDialog({ user, onClose, onSave, onDelete }: UserDialogProps) {
  const [nombre, setNombre] = useState(user?.nombre ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'mesero')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!nombre.trim() || !username.trim() || (!user && !password.trim())) return
    setLoading(true)
    setError(null)

    const data: Partial<Profile> & { password?: string } = {
      nombre: nombre.trim(),
      username: username.trim(),
      role,
    }
    if (password.trim()) data.password = password.trim()

    const err = await onSave(data)
    if (err) setError(err)
    setLoading(false)
  }

  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    setLoading(true)
    const err = await onDelete()
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">
            {user ? 'Editar usuario' : 'Agregar usuario'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div>
            <Label className="text-xs">Nombre completo</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan Perez" className="h-9 text-sm" />
          </div>

          <div>
            <Label className="text-xs">Usuario</Label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="juanperez"
              className="h-9 text-sm"
              disabled={!!user} // username can't change (it's the auth email)
            />
          </div>

          <div>
            <Label className="text-xs">
              Contraseña {user && <span className="text-muted-foreground">(dejar vacío para mantener)</span>}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Rol</Label>
            <Select value={role} onValueChange={v => setRole(v as UserRole)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map(r => (
                  <SelectItem key={r} value={r}>
                    <span className="flex items-center gap-1.5">
                      {ROLE_CONFIG[r].icon}
                      {ROLE_CONFIG[r].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            {onDelete && (
              <Button
                variant="outline"
                className={`h-9 text-xs border-destructive bg-transparent ${confirmDelete ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'text-destructive hover:bg-destructive/10'}`}
                onClick={handleDelete}
                disabled={loading}
                title={confirmDelete ? 'Confirmar eliminación' : 'Eliminar usuario'}
              >
                {confirmDelete ? <span className="text-[10px] px-1">¿Confirmar?</span> : <Trash2 className="h-3 w-3" />}
              </Button>
            )}
            <Button variant="outline" className="flex-1 h-9 text-xs bg-transparent" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              className="flex-1 h-9 text-xs bg-primary"
              onClick={handleSubmit}
              disabled={loading || !nombre.trim() || !username.trim() || (!user && !password.trim())}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : user ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
