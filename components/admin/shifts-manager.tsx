'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, LogIn, LogOut, Users, Calendar, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  nombre: string
  username: string
  role: string
}

interface Turno {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  break_min: number
  notas: string | null
  created_at: string
  profile?: Profile
}

function formatDuration(ms: number): string {
  const safeMs = Math.max(0, ms)
  const h = Math.floor(safeMs / 3_600_000)
  const m = Math.floor((safeMs % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}

function turnoMs(t: Turno): number {
  const from = new Date(t.clock_in)
  const to = t.clock_out ? new Date(t.clock_out) : new Date()
  return Math.max(0, to.getTime() - from.getTime() - t.break_min * 60_000)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function ShiftsManager() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState('todos')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [editingBreak, setEditingBreak] = useState<{ id: string; value: string } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: ps }, { data: ts }] = await Promise.all([
      supabase.from('profiles').select('id, nombre, username, role').eq('activo', true).order('nombre'),
      supabase.from('turnos').select('*').gte('clock_in', filterDate + 'T00:00:00').lte('clock_in', filterDate + 'T23:59:59').order('clock_in', { ascending: false }),
    ])
    if (ps) setProfiles(ps as Profile[])
    if (ts) {
      const profileMap = new Map((ps || []).map(p => [p.id, p as Profile]))
      setTurnos((ts as Turno[]).map(t => ({ ...t, profile: profileMap.get(t.user_id) })))
    }
    setLoading(false)
  }, [filterDate])

  useEffect(() => { loadData() }, [loadData])

  const handleClockOut = async (turnoId: string) => {
    await supabase.from('turnos').update({ clock_out: new Date().toISOString() }).eq('id', turnoId)
    loadData()
  }

  const handleSaveBreak = async (turnoId: string, breakMin: number) => {
    await supabase.from('turnos').update({ break_min: breakMin }).eq('id', turnoId)
    setEditingBreak(null)
    loadData()
  }

  // Admin clock-in on behalf of an employee
  const [clockInUserId, setClockInUserId] = useState('')
  const handleAdminClockIn = async () => {
    if (!clockInUserId) return
    // Check if already has open turno today
    const { data: existing } = await supabase
      .from('turnos')
      .select('id')
      .eq('user_id', clockInUserId)
      .is('clock_out', null)
      .single()
    if (existing) { alert('Este empleado ya tiene un turno abierto.'); return }
    await supabase.from('turnos').insert({ user_id: clockInUserId, clock_in: new Date().toISOString() })
    setClockInUserId('')
    loadData()
  }

  const filtered = filterUser === 'todos' ? turnos : turnos.filter(t => t.user_id === filterUser)

  // Summary: hours per employee today
  const summary = profiles.map(p => {
    const userTurnos = turnos.filter(t => t.user_id === p.id)
    const totalMs = userTurnos.reduce((sum, t) => sum + turnoMs(t), 0)
    const active = userTurnos.some(t => !t.clock_out)
    return { profile: p, totalMs, active, count: userTurnos.length }
  }).filter(s => s.count > 0)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {summary.map(s => (
            <Card key={s.profile.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground truncate">{s.profile.nombre}</span>
                  {s.active && <Badge className="text-[10px] h-4 px-1 bg-green-100 text-green-700">Activo</Badge>}
                </div>
                <p className="text-lg font-bold">{formatDuration(s.totalMs)}</p>
                <p className="text-xs text-muted-foreground">{s.count} turno{s.count !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 flex-wrap items-end">
        <div>
          <Label className="text-xs">Fecha</Label>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-36 h-9 text-sm" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <Label className="text-xs">Empleado</Label>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {profiles.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Admin clock-in */}
      <Card className="border-dashed">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Registrar entrada (admin)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex gap-2">
            <Select value={clockInUserId} onValueChange={setClockInUserId}>
              <SelectTrigger className="h-9 text-sm flex-1"><SelectValue placeholder="Seleccionar empleado..." /></SelectTrigger>
              <SelectContent>
                {profiles.filter(p => p.role !== 'admin').map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9 gap-1.5" onClick={handleAdminClockIn} disabled={!clockInUserId}>
              <Clock className="h-4 w-4" />
              Entrada
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Turnos list */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin turnos registrados para esta fecha</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <Card key={t.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{t.profile?.nombre ?? t.user_id.slice(0, 8)}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">{t.profile?.role}</Badge>
                      {!t.clock_out && <Badge className="text-[10px] h-4 px-1 bg-green-100 text-green-700">En turno</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(t.clock_in)}</span>
                      <span className="flex items-center gap-1"><LogIn className="h-3 w-3" />{formatTime(t.clock_in)}</span>
                      {t.clock_out && <span className="flex items-center gap-1"><LogOut className="h-3 w-3" />{formatTime(t.clock_out)}</span>}
                      {t.break_min > 0 && <span className="flex items-center gap-1"><Coffee className="h-3 w-3" />{t.break_min} min descanso</span>}
                    </div>
                    <p className="text-xs font-semibold text-foreground mt-1">
                      Total: {formatDuration(turnoMs(t))}
                    </p>
                    {t.notas && <p className="text-[11px] text-muted-foreground italic mt-0.5">{t.notas}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingBreak?.id === t.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          value={editingBreak.value}
                          onChange={e => setEditingBreak({ id: t.id, value: e.target.value })}
                          className="w-16 h-7 text-xs"
                        />
                        <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleSaveBreak(t.id, Number(editingBreak.value) || 0)}>Ok</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-1" onClick={() => setEditingBreak(null)}>✕</Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingBreak({ id: t.id, value: t.break_min.toString() })}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors text-xs text-muted-foreground"
                        title="Editar descanso"
                      >
                        <Coffee className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {!t.clock_out && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1 px-2"
                        onClick={() => handleClockOut(t.id)}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Salida
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
