import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default:  process.env.NEXT_PUBLIC_SITE_NAME ?? 'My Story Space',
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME ?? 'My Story Space'}`,
  },
  description: 'A premium cinematic storytelling platform',
  openGraph: {
    type:   'website',
    locale: 'en_US',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color:      '#e8e0d0',
              border:     '1px solid #2a2820',
            },
          }}
        />
      </body>
    </html>
  )
}
