import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/notify/whatsapp
 * Sends a WhatsApp message via Twilio.
 *
 * Body: { to: string, message: string }
 *   `to` must be in E.164 format, e.g. "+5215512345678"
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_FROM  — the Twilio sandbox/business number, e.g. "+14155238886"
 */

export async function POST(req: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !from) {
    return NextResponse.json({ error: 'Twilio not configured' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const { to, message } = body ?? {}

  if (!to || !message) {
    return NextResponse.json({ error: 'Missing to or message' }, { status: 400 })
  }

  // Strip non-digits for basic validation
  const digits = to.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const params = new URLSearchParams({
    From: `whatsapp:${from}`,
    To: `whatsapp:${to}`,
    Body: message,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('Twilio error:', text)
    return NextResponse.json({ error: 'Twilio error', detail: text }, { status: 502 })
  }

  const data = await response.json()
  return NextResponse.json({ sid: data.sid })
}
