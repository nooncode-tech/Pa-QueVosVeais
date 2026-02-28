'use client'

import React from "react"

import { useState } from 'react'
import { Plus, Edit2, User, Shield, ChefHat, UserCheck, Trash2 } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { User as UserType, UserRole } from '@/lib/store'

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: 'Administrador', icon: <Shield className="h-3.5 w-3.5" />, color: 'bg-primary text-primary-foreground' },
  mesero: { label: 'Mesero', icon: <UserCheck className="h-3.5 w-3.5" />, color: 'bg-amber-500 text-white' },
  cocina_a: { label: 'Cocina A', icon: <ChefHat className="h-3.5 w-3.5" />, color: 'bg-success text-success-foreground' },
  cocina_b: { label: 'Cocina B', icon: <ChefHat className="h-3.5 w-3.5" />, color: 'bg-blue-500 text-white' },
}

export function UsersManager() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  
  const handleToggleActive = (user: UserType) => {
    if (user.id !== currentUser?.id) {
      updateUser(user.id, { activo: !user.activo })
    }
  }
  
  return (
    <div className="p-3">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => {
          const count = users.filter(u => u.role === role && u.activo).length
          const config = ROLE_CONFIG[role]
          return (
            <Card key={role} className="bg-secondary/50">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-foreground">{count}</p>
                <p className="text-[9px] text-muted-foreground truncate">{config.label}s</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-foreground">Gestion de usuarios</h2>
          <p className="text-[10px] text-muted-foreground">
            {users.filter(u => u.activo).length} usuario{users.filter(u => u.activo).length !== 1 ? 's' : ''} activo{users.filter(u => u.activo).length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          className="bg-primary text-primary-foreground h-7 text-[10px] px-2.5"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      </div>
      
      {/* Users List */}
      <div className="space-y-1.5">
        {users.map((user) => {
          const roleConfig = ROLE_CONFIG[user.role]
          const isCurrentUser = user.id === currentUser?.id
          
          return (
            <Card 
              key={user.id} 
              className={`border ${!user.activo ? 'opacity-50' : ''} ${isCurrentUser ? 'border-primary' : ''}`}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${roleConfig.color} flex items-center justify-center`}>
                      {roleConfig.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-medium text-xs text-foreground">
                          {user.nombre}
                        </h4>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1">Tu</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[9px] h-4 ${roleConfig.color}`}>
                      {roleConfig.label}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={user.activo}
                        onCheckedChange={() => handleToggleActive(user)}
                        disabled={isCurrentUser}
                        className="scale-[0.6]"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingUser(user)}
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
      
      {/* Add/Edit Dialog */}
      {(showAddDialog || editingUser) && (
        <UserDialog
          user={editingUser}
          onClose={() => {
            setShowAddDialog(false)
            setEditingUser(null)
          }}
          onSave={(userData) => {
            if (editingUser) {
              updateUser(editingUser.id, userData)
            } else {
              addUser({
                ...userData,
                activo: true,
              })
            }
            setShowAddDialog(false)
            setEditingUser(null)
          }}
          onDelete={editingUser && editingUser.id !== currentUser?.id ? () => {
            deleteUser(editingUser.id)
            setEditingUser(null)
          } : undefined}
        />
      )}
    </div>
  )
}

interface UserDialogProps {
  user: UserType | null
  onClose: () => void
  onSave: (userData: Partial<UserType>) => void
  onDelete?: () => void
}

function UserDialog({ user, onClose, onSave, onDelete }: UserDialogProps) {
  const [nombre, setNombre] = useState(user?.nombre || '')
  const [username, setUsername] = useState(user?.username || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(user?.role || 'mesero')
  
  const handleSubmit = () => {
    if (nombre.trim() && username.trim() && (user || password.trim())) {
      const userData: Partial<UserType> = {
        nombre: nombre.trim(),
        username: username.trim(),
        role,
      }
      if (password.trim()) {
        userData.password = password.trim()
      }
      onSave(userData)
    }
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
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Perez"
              className="h-9 text-sm"
            />
          </div>
          
          <div>
            <Label className="text-xs">Usuario</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="juanperez"
              className="h-9 text-sm"
            />
          </div>
          
          <div>
            <Label className="text-xs">
              Contrasena {user && '(dejar vacio para mantener)'}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="h-9 text-sm"
            />
          </div>
          
          <div>
            <Label className="text-xs">Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
                  const config = ROLE_CONFIG[r]
                  return (
                    <SelectItem key={r} value={r}>
                      <span className="flex items-center gap-1.5">
                        {config.icon}
                        {config.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-2">
            {onDelete && (
              <Button 
                variant="outline" 
                className="h-9 text-xs text-destructive border-destructive hover:bg-destructive/10 bg-transparent"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            <Button variant="outline" className="flex-1 h-9 text-xs bg-transparent" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 h-9 text-xs bg-primary"
              onClick={handleSubmit}
              disabled={!nombre.trim() || !username.trim() || (!user && !password.trim())}
            >
              {user ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
