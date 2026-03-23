'use client'

import { useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { type Order, type TableSession } from '@/lib/store'
import { KitchenTicket } from './kitchen-ticket'
import { CustomerReceipt } from './customer-receipt'

interface PrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'kitchen' | 'receipt'
  order?: Order
  session?: TableSession
  kitchen?: 'a' | 'b' | 'all'
}

export function PrintDialog({ open, onOpenChange, type, order, session, kitchen = 'all' }: PrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)
  
  const handlePrint = useCallback(() => {
    if (!printRef.current) return
    
    const printContents = printRef.current.innerHTML
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${type === 'kitchen' ? `Comanda-${order?.numero}` : `Recibo-${session?.orders[0]?.numero || order?.numero}`}</title>
            <meta charset="utf-8" />
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body {
                width: 80mm;
                font-family: 'Courier New', Courier, monospace;
                font-size: 11px;
                line-height: 1.4;
                color: #000;
                background: #fff;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              /* Tailwind utility resets for print */
              .bg-white { background: #fff; }
              .text-black { color: #000; }
              .font-mono { font-family: 'Courier New', Courier, monospace; }
              .p-4 { padding: 4mm; }
              .p-2 { padding: 2mm; }
              .w-\\[80mm\\] { width: 80mm; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .text-xl { font-size: 15px; }
              .text-lg { font-size: 13px; }
              .text-sm { font-size: 11px; }
              .text-xs { font-size: 9px; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-\\[10\\.5px\\] { font-size: 10.5px; }
              .border-b-2 { border-bottom: 2px solid #000; }
              .border-b { border-bottom: 1px dashed #000; }
              .border-t { border-top: 1px dashed #000; }
              .border-dashed { border-style: dashed; }
              .border-black { border-color: #000; }
              .border-gray-200 { border-color: #ccc; }
              .border-gray-300 { border-color: #aaa; }
              .pb-3 { padding-bottom: 3mm; }
              .pb-2 { padding-bottom: 2mm; }
              .pb-1 { padding-bottom: 1mm; }
              .pt-2 { padding-top: 2mm; }
              .pt-1 { padding-top: 1mm; }
              .mb-3 { margin-bottom: 3mm; }
              .mb-2 { margin-bottom: 2mm; }
              .mb-1 { margin-bottom: 1mm; }
              .mt-4 { margin-top: 4mm; }
              .mt-2 { margin-top: 2mm; }
              .mt-1 { margin-top: 1mm; }
              .py-1 { padding-top: 1mm; padding-bottom: 1mm; }
              .py-2 { padding-top: 2mm; padding-bottom: 2mm; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .gap-1 { gap: 2mm; }
              .w-full { width: 100%; }
              .block { display: block; }
              .space-y-1 > * + * { margin-top: 1mm; }
              .uppercase { text-transform: uppercase; }
              table { border-collapse: collapse; width: 100%; }
              th, td { padding: 0.5mm 0; vertical-align: top; }
              .text-green-700 { color: #15803d; }
              .text-gray-400 { color: #999; }
              .text-gray-500 { color: #777; }
              .text-red-600 { color: #dc2626; }
              .text-orange-500 { color: #f97316; }
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }, [type, order, session])
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'kitchen' ? 'Comanda de Cocina' : 'Recibo del Cliente'}
          </DialogTitle>
          <DialogDescription>
            Vista previa del ticket. Haz clic en imprimir para enviar a la impresora.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center py-4 bg-gray-100 rounded-lg max-h-[60vh] overflow-y-auto">
          <div className="transform scale-90 origin-top">
            {type === 'kitchen' && order && (
              <KitchenTicket ref={printRef} order={order} kitchen={kitchen} />
            )}
            {type === 'receipt' && (
              <CustomerReceipt ref={printRef} order={order} session={session} />
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
