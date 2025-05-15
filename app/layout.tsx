import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import ClientLayout from '@/components/ClientLayout'

// Metadata must be exported from a server component
export const metadata: Metadata = {
  title: 'Taskflow-AI',
  description: 'A task management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  )
}