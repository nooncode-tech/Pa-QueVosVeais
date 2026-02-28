'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context'

import { MenuView } from './menu-view'
import { CartView } from './cart-view'
import { OrderStatusView } from './order-status-view'
import { ItemDetailView } from './item-detail-view'
import { ClienteBottomNav } from './cliente-bottom-nav'
import { WaiterCallDialog } from './waiter-call-dialog'
import { RewardsSheet } from './rewards-sheet'

import type { MenuItem } from '@/lib/store'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const GOOGLE_REVIEW_URL = 'https://www.google.com/maps/place/Pa+que+vos+Veais+RESTAURANTE/@19.3719375,-99.1348876,17z/data=!4m8!3m7!1s0x85d1ff5317a00b69:0x83f28a77607266ae!8m2!3d19.3719325!4d-99.1323127!9m1!1b1!16s%2Fg%2F11lzpgjmdd?entry=ttu&g_ep=EgoyMDI2MDIxMS4wIKXMDSoASAFQAw%3D%3D'

/* =======================
   TYPES
======================= */
type ClienteScreen = 'menu' | 'item' | 'cart' | 'status' | 'feedback'

interface ClienteViewProps {
  mesa: number
  onBack: () => void
}

/* =======================
   FEEDBACK SCREEN
======================= */
function FeedbackScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <Image src="/logo.png" alt="Pa' Que Vos Veais" width={80} height={80} className="w-20 h-20 object-contain" priority />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Gracias por tu visita
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tu opinion nos ayuda muchisimo a mejorar
          </p>
        </div>

        <Button
          className="w-full bg-foreground text-background flex items-center justify-center gap-2 h-12 text-sm font-semibold rounded-xl"
          onClick={() => window.open(GOOGLE_REVIEW_URL, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
          Dejar una resena en Google
        </Button>

        <p className="text-xs text-muted-foreground">
          Se abrira Google Maps para publicar tu opinion
        </p>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={onFinish}
        >
          Finalizar
        </Button>
      </div>
    </div>
  )
}

/* =======================
   COMPONENT
======================= */
export function ClienteView({ mesa, onBack }: ClienteViewProps) {
  const {
    orders,
    cart,
    tableSessions,
    createTableSession,
    getTableSession,
    waiterCalls,
  } = useApp()

  const [screen, setScreen] = useState<ClienteScreen>('menu')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showWaiterCall, setShowWaiterCall] = useState(false)
  const [showRewards, setShowRewards] = useState(false)

  /* =======================
     SESSION
  ======================= */
  useEffect(() => {
    const existingSession = getTableSession(mesa)
    if (!existingSession) {
      createTableSession(mesa)
    }
  }, [mesa, getTableSession, createTableSession])

  const session = tableSessions.find(s => s.mesa === mesa && s.activa)
  const sessionId = session?.id ?? ''

  /* =======================
     DETECT SESSION CLOSED BY MESERO
  ======================= */
  useEffect(() => {
    // If the session is no longer active (mesero closed it), show feedback
    if (!session && screen !== 'feedback') {
      // Check if there was a session before that got closed
      const closedSession = tableSessions.find(
        s => s.mesa === mesa && !s.activa && s.billStatus === 'cerrada'
      )
      if (closedSession) {
        setScreen('feedback')
      }
    }
  }, [session, mesa, tableSessions, screen])

  // If session is paid, auto-navigate to feedback when no more active orders
  useEffect(() => {
    if (session?.billStatus === 'pagada') {
      const activeOrders = (session.orders || []).filter(
        o => o.status !== 'entregado' && o.status !== 'cancelado'
      )
      if (activeOrders.length === 0) {
        setScreen('feedback')
      }
    }
  }, [session])

  /* =======================
     DERIVED STATE
  ======================= */
  const tableOrders = orders.filter(
    o => o.mesa === mesa && o.status !== 'entregado' && o.status !== 'cancelado'
  )

  const canOrder = !session || session.billStatus === 'abierta'

  const hasActiveWaiterCall = waiterCalls.some(
    c => c.mesa === mesa && !c.atendido
  )

  const showBottomNav = ['menu', 'status'].includes(screen)

  /* =======================
     NAV HANDLERS
  ======================= */
  const goMenu = () => setScreen('menu')

  const handleSelectItem = (item: MenuItem) => {
    if (!canOrder) return
    setSelectedItem(item)
    setScreen('item')
  }

  const handleFinishFeedback = () => {
    onBack()
  }

  /* =======================
     RENDER SCREEN
  ======================= */
  const renderScreen = () => {
    switch (screen) {
      case 'feedback':
        return <FeedbackScreen onFinish={handleFinishFeedback} />

      case 'item':
        return selectedItem ? (
          <ItemDetailView
            item={selectedItem}
            onBack={goMenu}
            onAddToCart={goMenu}
            cartItemCount={cart.length}
            canOrder={canOrder}
          />
        ) : null

      case 'cart':
        return (
          <CartView
            mesa={mesa}
            onBack={goMenu}
            onOrderConfirmed={() => setScreen('status')}
          />
        )

      case 'status':
        return (
          <OrderStatusView
            orders={tableOrders}
            mesa={mesa}
            onBack={goMenu}
          />
        )

      default:
        return (
          <MenuView
            mesa={mesa}
            onSelectItem={handleSelectItem}
            onGoToCart={() => setScreen('cart')}
            cartItemCount={cart.length}
            hasActiveOrders={tableOrders.length > 0}
            onViewStatus={() => setScreen('status')}
            onExit={onBack}
            canOrder={canOrder}
          />
        )
    }
  }

  /* =======================
     JSX
  ======================= */
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className={showBottomNav ? 'pb-16' : ''}>
        {renderScreen()}
      </div>

      {showBottomNav && (
        <ClienteBottomNav
          activeScreen={screen}
          onMenuClick={() => setScreen('menu')}
          onStatusClick={() => setScreen('status')}
          onCallWaiter={() => setShowWaiterCall(true)}
          hasActiveOrders={tableOrders.length > 0}
          cartCount={cart.length}
          hasActiveWaiterCall={hasActiveWaiterCall}
        />
      )}

      {showWaiterCall && (
        <WaiterCallDialog
          mesa={mesa}
          onClose={() => setShowWaiterCall(false)}
        />
      )}

      {showRewards && (
        <RewardsSheet
          sessionId={sessionId}
          onClose={() => setShowRewards(false)}
        />
      )}
    </div>
  )
}
