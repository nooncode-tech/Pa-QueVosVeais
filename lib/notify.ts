/**
 * Client-side helper for sending WhatsApp notifications.
 * Calls the internal Next.js API route which uses Twilio.
 */
export async function sendWhatsApp(to: string, message: string): Promise<void> {
  try {
    await fetch('/api/notify/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    })
  } catch {
    // Notifications are best-effort — never block the UI
  }
}

/** Formats a delivery order notification message */
export function deliveryReadyMessage(orderNumber: number, clientName: string): string {
  return `¡Hola ${clientName}! Tu pedido #${orderNumber} está listo y en camino. 🛵`
}

/** Formats an order-ready for pickup message */
export function pickupReadyMessage(orderNumber: number, clientName: string): string {
  return `¡Hola ${clientName}! Tu pedido #${orderNumber} ya está listo para recoger. 🍽️`
}
