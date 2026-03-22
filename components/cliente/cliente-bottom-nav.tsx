'use client'

import { ClipboardList, Bell, Receipt } from 'lucide-react'
import Image from 'next/image'

type ClienteScreen = 'menu' | 'item' | 'cart' | 'status' | 'bill' | 'feedback'

interface ClienteBottomNavProps {
  activeScreen: ClienteScreen
  onMenuClick: () => void
  onStatusClick: () => void
  onBillClick: () => void
  onCallWaiter: () => void
  hasActiveOrders: boolean
  hasBill: boolean
  cartCount: number
  hasActiveWaiterCall?: boolean
}

export function ClienteBottomNav({
  activeScreen,
  onMenuClick,
  onStatusClick,
  onBillClick,
  onCallWaiter,
  hasActiveOrders,
  hasBill,
  hasActiveWaiterCall = false,
}: ClienteBottomNavProps) {
  const navItems = [
    {
      key: 'menu',
      label: 'Menú',
      icon: null,
      isLogo: true,
      onClick: onMenuClick,
      active: activeScreen === 'menu',
    },
    {
      key: 'status',
      label: 'Pedidos',
      icon: ClipboardList,
      isLogo: false,
      onClick: onStatusClick,
      active: activeScreen === 'status',
      badge: hasActiveOrders,
    },
    {
      key: 'bill',
      label: 'Cuenta',
      icon: Receipt,
      isLogo: false,
      onClick: onBillClick,
      active: activeScreen === 'bill',
      hidden: !hasBill,
    },
    {
      key: 'waiter',
      label: 'Mesero',
      icon: Bell,
      isLogo: false,
      onClick: onCallWaiter,
      active: false,
      isWaiterCall: true,
    },
  ]

  const visibleItems = navItems.filter(item => !item.hidden)

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 max-w-md mx-auto">
      <div className="flex items-center justify-around py-2">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isWaiterActive = item.isWaiterCall && hasActiveWaiterCall

          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors relative ${
                item.active
                  ? 'text-primary'
                  : isWaiterActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                {item.isLogo ? (
                  <Image
                    src="/logo.png"
                    alt="Menú"
                    width={20}
                    height={20}
                    className={`h-5 w-5 object-contain ${item.active ? '' : 'opacity-50'}`}
                  />
                ) : Icon ? (
                  <Icon className={`h-5 w-5 ${isWaiterActive ? 'animate-pulse' : ''}`} />
                ) : null}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
                {isWaiterActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${isWaiterActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  )
}
