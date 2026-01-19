import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/sidebar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quarterly Vault - Financial Insights Dashboard',
  description: 'Compare quarterly financial results and strategic insights across companies.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
