'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { SupabaseAuthProvider } from '@/lib/contexts/SupabaseAuthContext'
import { SessionTimeoutWarning } from '@/components/auth'
import './globals.css'
import { useState } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  }))

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <SupabaseAuthProvider>
            <TooltipProvider>
              {children}
              <SessionTimeoutWarning />
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </SupabaseAuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
