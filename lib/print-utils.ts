import { type Order, getChannelLabel, formatTime } from './store'

/**
 * Generates the HTML content for a kitchen ticket without React rendering.
 * Used for programmatic (auto) printing.
 */
function buildKitchenTicketHTML(order: Order, kitchen: 'a' | 'b' | 'all' = 'all'): string {
  const kitchenKey = kitchen === 'a' ? 'cocina_a' : kitchen === 'b' ? 'cocina_b' : null
  const items = kitchenKey
    ? order.items.filter(i => i.menuItem.cocina === kitchenKey || i.menuItem.cocina === 'ambas')
    : order.items

  if (items.length === 0) return ''

  const kitchenLabel = kitchen === 'a' ? 'COCINA A — Tacos' : kitchen === 'b' ? 'COCINA B — Antojitos' : ''

  const itemRows = items.map(item => {
    const extras = item.extras?.length ? `<p style="font-size:10px;padding-left:8px">+ ${item.extras.map(e => e.nombre).join(', ')}</p>` : ''
    const mods = item.modificadores?.length
      ? item.modificadores.map(mg => `<p style="font-size:10px;font-weight:bold;padding-left:8px;text-transform:uppercase">${mg.grupoNombre}: ${mg.opciones.map(o => o.nombre).join(' / ')}</p>`).join('')
      : ''
    const notas = item.notas ? `<p style="font-size:10px;font-weight:bold;padding-left:8px">*** ${item.notas} ***</p>` : ''
    return `
      <div style="border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:4px">
        <div style="display:flex;gap:8px">
          <span style="font-size:18px;font-weight:bold;width:28px">${item.cantidad}x</span>
          <div>
            <p style="font-weight:bold;font-size:13px;text-transform:uppercase">${item.menuItem.nombre}</p>
            ${extras}${mods}${notas}
          </div>
        </div>
      </div>`
  }).join('')

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0)
  const deliveryRow = order.canal === 'delivery' && order.direccion
    ? `<p style="font-size:10px;border:1px solid #000;padding:3px;margin-top:6px">DELIVERY: ${order.direccion}</p>`
    : ''

  return `
    <div style="font-family:'Courier New',monospace;font-size:12px;padding:8px;width:80mm">
      <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:6px;margin-bottom:6px">
        <h1 style="font-size:22px;font-weight:bold;margin:0">COMANDA</h1>
        ${kitchenLabel ? `<p style="font-size:15px;font-weight:bold">${kitchenLabel}</p>` : ''}
      </div>
      <div style="border-bottom:1px dashed #000;padding-bottom:6px;margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold">
          <span>#${order.numero}</span><span>${formatTime(order.createdAt)}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="font-weight:bold">${getChannelLabel(order.canal).toUpperCase()}</span>
          ${order.mesa ? `<span>Mesa: ${order.mesa}</span>` : ''}
        </div>
        ${order.nombreCliente ? `<p style="font-weight:bold;margin-top:3px">${order.nombreCliente}</p>` : ''}
      </div>
      <div style="margin-bottom:10px">${itemRows}</div>
      <div style="text-align:center;border-top:2px dashed #000;padding-top:6px">
        <p style="font-size:14px">Total ítems: <strong>${totalItems}</strong></p>
        ${deliveryRow}
      </div>
      <p style="margin-top:8px;text-align:center;font-size:9px;color:#999">Impreso: ${new Date().toLocaleString('es-MX')}</p>
    </div>`
}

const PRINT_CSS = `
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 80mm; font-family: 'Courier New', Courier, monospace; background: #fff; color: #000; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
`

/**
 * Silently prints a kitchen ticket for the given order.
 * Splits by kitchen if the order has items for both.
 */
export function autoPrintKitchenTicket(order: Order): void {
  if (typeof window === 'undefined') return

  const needsA = order.items.some(i => i.menuItem.cocina === 'cocina_a' || i.menuItem.cocina === 'ambas')
  const needsB = order.items.some(i => i.menuItem.cocina === 'cocina_b' || i.menuItem.cocina === 'ambas')

  // Decide whether to split or print together
  const tickets: Array<'a' | 'b' | 'all'> =
    needsA && needsB ? ['a', 'b'] : ['all']

  for (const kitchen of tickets) {
    const html = buildKitchenTicketHTML(order, kitchen)
    if (!html) continue

    const win = window.open('', '_blank', 'width=320,height=500')
    if (!win) return  // popup blocked — fail silently

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PRINT_CSS}</style></head><body>${html}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 200)
  }
}
