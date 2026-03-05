"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react"

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number | string
  badgeVariant?: "default" | "destructive" | "warning" | "success"
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  logo?: React.ReactNode
  navGroups: NavGroup[]
  activeItem: string
  onNavClick: (id: string) => void
  onLogout?: () => void
  headerActions?: React.ReactNode
  footerContent?: React.ReactNode
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const badgeVariants = {
  default: "bg-primary text-primary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  warning: "bg-warning text-warning-foreground",
  success: "bg-success text-success-foreground",
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  logo,
  navGroups,
  activeItem,
  onNavClick,
  onLogout,
  headerActions,
  footerContent,
  collapsed = false,
  onCollapsedChange,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed)

  const handleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    onCollapsedChange?.(newState)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Logo / Brand */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                {logo}
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground leading-tight">{title}</span>
                  {subtitle && (
                    <span className="text-xs text-muted-foreground">{subtitle}</span>
                  )}
                </div>
              </div>
            )}
            {isCollapsed && logo && (
              <div className="flex w-full justify-center">{logo}</div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 shrink-0", isCollapsed && "mx-auto")}
              onClick={handleCollapse}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="flex flex-col gap-1">
              {navGroups.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {group.title && !isCollapsed && (
                    <div className="px-3 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.title}
                      </span>
                    </div>
                  )}
                  {group.title && isCollapsed && groupIndex > 0 && (
                    <Separator className="my-2" />
                  )}
                  {group.items.map((item) => {
                    const isActive = activeItem === item.id
                    const button = (
                      <Button
                        key={item.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 transition-colors",
                          isCollapsed && "justify-center px-0",
                          isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                        )}
                        onClick={() => onNavClick(item.id)}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge !== undefined && (
                              <span
                                className={cn(
                                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
                                  badgeVariants[item.badgeVariant || "default"]
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Button>
                    )

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-2">
                            {item.label}
                            {item.badge !== undefined && (
                              <span
                                className={cn(
                                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
                                  badgeVariants[item.badgeVariant || "default"]
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return button
                  })}
                </React.Fragment>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border p-2">
            {footerContent && !isCollapsed && (
              <div className="mb-2 px-2">{footerContent}</div>
            )}
            {onLogout && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 text-muted-foreground hover:text-destructive",
                      isCollapsed && "justify-center px-0"
                    )}
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    {!isCollapsed && <span>Cerrar Sesión</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">Cerrar Sesión</TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          {headerActions && (
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
              <div />
              <div className="flex items-center gap-2">{headerActions}</div>
            </header>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  )
}

// Mini layout for mobile or simpler views
interface MiniLayoutProps {
  children: React.ReactNode
  title: string
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  bottomNav?: React.ReactNode
}

export function MiniLayout({
  children,
  title,
  leftAction,
  rightAction,
  bottomNav,
}: MiniLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          {leftAction}
        </div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <div className="flex items-center gap-2">
          {rightAction}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Bottom Navigation */}
      {bottomNav && (
        <nav className="shrink-0 border-t border-border bg-card">
          {bottomNav}
        </nav>
      )}
    </div>
  )
}
