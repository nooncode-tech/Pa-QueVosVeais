import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/cfdi
 *
 * Emite un CFDI 4.0 vía Facturama y lo envía por email al receptor.
 * Si las credenciales de Facturama no están configuradas, guarda la solicitud
 * como "pendiente" para procesado manual.
 *
 * Body: SolicitudPayload (ver abajo)
 *
 * Env vars requeridas para emisión automática:
 *   FACTURAMA_USER            — usuario de la API de Facturama
 *   FACTURAMA_PASSWORD        — contraseña
 *   FACTURAMA_EXPEDITION_ZIP  — CP del lugar de expedición (de tu cuenta Facturama)
 *   FACTURAMA_SANDBOX         — "true" para usar sandbox (apisandbox.facturama.mx)
 */

interface SolicitudPayload {
  session_id: string | null
  mesa: number | null
  total: number           // total con IVA incluido
  rfc: string
  razon_social: string
  regimen_fiscal: string  // e.g. "616 - Sin obligaciones fiscales" — extraemos solo el código
  uso_cfdi: string        // e.g. "G03 - Gastos en general"
  email: string
  cp: string
  items?: Array<{ description: string; quantity: number; unitValue: number }>
}

function extractCode(value: string): string {
  // "616 - Sin obligaciones fiscales" → "616"
  return value.split(' - ')[0].trim()
}

async function emitirCFDI(payload: SolicitudPayload, authHeader: string, baseUrl: string): Promise<{ cfdiId: string; pdfUrl: string | null }> {
  const iva = payload.total / 1.16 * 0.16
  const subtotal = payload.total - iva
  const expeditionZip = process.env.FACTURAMA_EXPEDITION_ZIP ?? '06600'

  const cfdiBody = {
    Receiver: {
      Rfc: payload.rfc,
      Name: payload.razon_social,
      CfdiUse: extractCode(payload.uso_cfdi),
      FiscalRegime: extractCode(payload.regimen_fiscal),
      TaxZipCode: payload.cp,
    },
    CfdiType: 'I',
    PaymentForm: '99',     // Por definir
    Currency: 'MXN',
    PaymentMethod: 'PUE',  // Pago en una sola exhibición
    ExpeditionPlace: expeditionZip,
    Items: payload.items && payload.items.length > 0
      ? payload.items.map(item => ({
          ProductCode: '90101501',   // Alimentos preparados para consumo en el lugar de su enajenación
          Unit: 'ACT',
          UnitCode: 'ACT',
          Description: item.description,
          Quantity: item.quantity,
          UnitValue: Number((item.unitValue / 1.16).toFixed(6)),
          Taxes: [
            {
              Total: Number((item.unitValue * item.quantity * 0.16 / 1.16).toFixed(6)),
              Name: 'IVA',
              Base: Number((item.unitValue * item.quantity / 1.16).toFixed(6)),
              Rate: 0.16,
              IsRetention: false,
            },
          ],
        }))
      : [
          {
            ProductCode: '90101501',
            Unit: 'ACT',
            UnitCode: 'ACT',
            Description: 'Consumo en restaurante' + (payload.mesa ? ` Mesa ${payload.mesa}` : ''),
            Quantity: 1,
            UnitValue: Number(subtotal.toFixed(6)),
            Taxes: [
              {
                Total: Number(iva.toFixed(6)),
                Name: 'IVA',
                Base: Number(subtotal.toFixed(6)),
                Rate: 0.16,
                IsRetention: false,
              },
            ],
          },
        ],
  }

  const createRes = await fetch(`${baseUrl}/api/2/cfdis`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cfdiBody),
  })

  if (!createRes.ok) {
    const errText = await createRes.text()
    throw new Error(`Facturama create error ${createRes.status}: ${errText}`)
  }

  const cfdi = await createRes.json() as { Id: string }

  // Send by email
  await fetch(`${baseUrl}/api/2/Cfdi/${cfdi.Id}/email/${encodeURIComponent(payload.email)}`, {
    method: 'POST',
    headers: { Authorization: authHeader },
  })

  // Get PDF download URL
  const pdfRes = await fetch(`${baseUrl}/api/2/cfdi-files/${cfdi.Id}/pdf`, {
    headers: { Authorization: authHeader },
  })
  let pdfUrl: string | null = null
  if (pdfRes.ok) {
    const pdfData = await pdfRes.json() as { Content?: string }
    if (pdfData.Content) {
      pdfUrl = `data:application/pdf;base64,${pdfData.Content}`
    }
  }

  return { cfdiId: cfdi.Id, pdfUrl }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as SolicitudPayload | null
  if (!body || !body.rfc || !body.email || !body.total) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  // Supabase admin client for updating status
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Save solicitud first (or upsert if id provided)
  const solicitudPayload = {
    session_id: body.session_id ?? null,
    mesa: body.mesa ?? null,
    total: body.total,
    rfc: body.rfc,
    razon_social: body.razon_social,
    regimen_fiscal: body.regimen_fiscal,
    uso_cfdi: body.uso_cfdi,
    email: body.email,
    cp: body.cp,
    status: 'pendiente',
  }

  const { data: solicitud, error: dbInsertError } = await supabaseAdmin
    .from('solicitudes_factura')
    .insert(solicitudPayload)
    .select('id')
    .single()

  if (dbInsertError || !solicitud) {
    return NextResponse.json({ error: 'Error guardando solicitud', detail: dbInsertError?.message }, { status: 500 })
  }

  // Attempt Facturama emission if credentials exist
  const facturamaUser = process.env.FACTURAMA_USER
  const facturamaPass = process.env.FACTURAMA_PASSWORD

  if (!facturamaUser || !facturamaPass) {
    // Graceful degradation — solicitud saved as pendiente
    return NextResponse.json({ status: 'pendiente', solicitudId: solicitud.id, message: 'Solicitud guardada. Será procesada manualmente.' })
  }

  try {
    const sandbox = process.env.FACTURAMA_SANDBOX === 'true'
    const baseUrl = sandbox ? 'https://apisandbox.facturama.mx' : 'https://api.facturama.mx'
    const authHeader = `Basic ${Buffer.from(`${facturamaUser}:${facturamaPass}`).toString('base64')}`

    const { cfdiId } = await emitirCFDI(body, authHeader, baseUrl)

    // Mark as procesada
    await supabaseAdmin
      .from('solicitudes_factura')
      .update({ status: 'procesada', notas: `CFDI: ${cfdiId}` })
      .eq('id', solicitud.id)

    return NextResponse.json({ status: 'emitida', cfdiId, solicitudId: solicitud.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Facturama error:', message)

    // Save error note but keep as pendiente
    await supabaseAdmin
      .from('solicitudes_factura')
      .update({ notas: `Error automático: ${message.slice(0, 200)}` })
      .eq('id', solicitud.id)

    return NextResponse.json({ status: 'pendiente', solicitudId: solicitud.id, message: 'Error al emitir CFDI. Solicitud guardada para procesado manual.' })
  }
}

/**
 * POST /api/cfdi/emit — emite CFDI para una solicitud ya existente (desde admin)
 * Body: { solicitudId: string }
 */
export async function PUT(req: NextRequest) {
  const { solicitudId } = await req.json().catch(() => ({})) as { solicitudId?: string }
  if (!solicitudId) return NextResponse.json({ error: 'solicitudId requerido' }, { status: 400 })

  const facturamaUser = process.env.FACTURAMA_USER
  const facturamaPass = process.env.FACTURAMA_PASSWORD
  if (!facturamaUser || !facturamaPass) {
    return NextResponse.json({ error: 'Facturama no configurado' }, { status: 503 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: sol } = await supabaseAdmin
    .from('solicitudes_factura')
    .select('*')
    .eq('id', solicitudId)
    .single()

  if (!sol) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  try {
    const sandbox = process.env.FACTURAMA_SANDBOX === 'true'
    const baseUrl = sandbox ? 'https://apisandbox.facturama.mx' : 'https://api.facturama.mx'
    const authHeader = `Basic ${Buffer.from(`${facturamaUser}:${facturamaPass}`).toString('base64')}`

    const { cfdiId } = await emitirCFDI(sol as SolicitudPayload, authHeader, baseUrl)

    await supabaseAdmin
      .from('solicitudes_factura')
      .update({ status: 'procesada', notas: `CFDI: ${cfdiId}` })
      .eq('id', solicitudId)

    return NextResponse.json({ status: 'emitida', cfdiId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabaseAdmin
      .from('solicitudes_factura')
      .update({ notas: `Error: ${message.slice(0, 200)}` })
      .eq('id', solicitudId)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
