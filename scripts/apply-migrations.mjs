/**
 * apply-migrations.mjs
 * Aplica las migraciones de supabase/ usando el endpoint interno de Supabase.
 *
 * Uso:
 *   node scripts/apply-migrations.mjs
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')

function loadEnv() {
  const raw = readFileSync(join(root, '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const [k, ...v] = t.split('=')
    env[k.trim()] = v.join('=').trim()
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan variables en .env.local'); process.exit(1)
}

// Supabase expone un endpoint de SQL seguro con service_role
async function execSQL(sql) {
  // Intentamos el endpoint de query de la REST API interna
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  if (res.ok) return { ok: true }

  // Fallback: endpoint de query directo vía pg-meta (disponible en proyectos Supabase)
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
  const res2 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  if (res2.ok) return { ok: true }

  const err = await res2.text().catch(() => res.statusText)
  return { ok: false, status: res2.status, error: err }
}

const migrDir = join(root, 'supabase')
const files = readdirSync(migrDir).filter(f => /^\d{3}_.*\.sql$/.test(f)).sort()

console.log(`\n🔄  ${files.length} migraciones → ${SUPABASE_URL}\n`)
let ok = 0, fail = 0

for (const f of files) {
  const sql = readFileSync(join(migrDir, f), 'utf8')
  process.stdout.write(`  ${f} ... `)
  const r = await execSQL(sql)
  if (r.ok) { console.log('✅'); ok++ }
  else if ((r.error || '').toLowerCase().match(/already exists|duplicate/)) {
    console.log('✅ (ya existía)'); ok++
  } else if (r.status === 401 || r.status === 403) {
    console.log('⚠️  Requiere Supabase Access Token'); fail++; break
  } else {
    console.log(`❌  ${String(r.error).slice(0, 100)}`); fail++
  }
}

const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
console.log(`\n📊  ${ok} OK, ${fail} error(es)\n`)
if (fail > 0) {
  console.log(`
┌─────────────────────────────────────────────────────────────┐
│  APLICAR MIGRACIONES MANUALMENTE (1 paso)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Abre este link:                                         │
│  https://supabase.com/dashboard/project/${ref}/sql/new  │
│                                                             │
│  2. Haz clic en "Open file" y selecciona:                   │
│     supabase/apply-all.sql                                  │
│                                                             │
│  3. Clic en "Run" — eso es todo.                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
`)
}
