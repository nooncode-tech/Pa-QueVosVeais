'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface StripePaymentFormProps {
  amount: number        // in MXN pesos
  description?: string
  onSuccess: () => void
  onCancel: () => void
}

function InnerForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Error al procesar el pago')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cobrar con tarjeta'}
        </Button>
      </div>
    </form>
  )
}

export function StripePaymentForm({ amount, description, onSuccess, onCancel }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)

  useEffect(() => {
    if (!stripePublishableKey) {
      setSetupError('Stripe no está configurado. Añade NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY y STRIPE_SECRET_KEY al entorno.')
      return
    }
    fetch('/api/payment/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setSetupError(data.error)
        else setClientSecret(data.clientSecret)
      })
      .catch(() => setSetupError('Error de red al crear la intención de pago'))
  }, [amount, description])

  if (setupError) {
    return (
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 space-y-2">
        <p className="font-medium">Stripe no disponible</p>
        <p>{setupError}</p>
        <Button variant="outline" size="sm" className="bg-transparent" onClick={onCancel}>
          Volver
        </Button>
      </div>
    )
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: 'stripe' }, locale: 'es-419' }}
    >
      <InnerForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  )
}
