import { NextRequest, NextResponse } from 'next/server'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export async function POST(req: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Stripe no configurado. Añade STRIPE_SECRET_KEY al entorno.' },
      { status: 503 }
    )
  }

  const { amount, currency = 'mxn', description } = await req.json()

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }

  // Lazy import so the server doesn't fail at startup when key is missing
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2026-02-25.clover' })

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe uses cents
    currency,
    description: description ?? 'Pa\' Que Vos Veáis — Mesa',
    automatic_payment_methods: { enabled: true },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
