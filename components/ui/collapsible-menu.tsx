'use client'

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"

interface CollapsibleMenuItemProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleMenuItem({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}: CollapsibleMenuItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const { state } = useSidebar()

  // Hide children when sidebar is collapsed
  const shouldShowChildren = state === "expanded" && isOpen

  return (
    <SidebarMenuItem>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start px-2 py-2 h-auto text-left",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 w-full">
          <Icon className="h-4 w-4 shrink-0" />
          {state === "expanded" && (
            <>
              <span className="truncate flex-1">{title}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 ml-auto" />
              )}
            </>
          )}
        </div>
      </Button>
      {shouldShowChildren && (
        <div className="ml-6 mt-1 space-y-1">
          {children}
        </div>
      )}
    </SidebarMenuItem>
  )
}

interface CollapsibleSubMenuItemProps {
  title: string
  href: string
  isActive?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export function CollapsibleSubMenuItem({ 
  title, 
  href, 
  isActive = false, 
  icon: Icon 
}: CollapsibleSubMenuItemProps) {
  const { state } = useSidebar()

  return (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      className={cn(
        "h-7 text-sm",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      )}
    >
      <a href={href} className="flex items-center gap-2 px-2 py-1 rounded-md">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {state === "expanded" && <span className="truncate">{title}</span>}
      </a>
    </SidebarMenuButton>
  )
}









