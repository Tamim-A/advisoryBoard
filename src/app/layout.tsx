import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Advisory Board — مجلسك الاستشاري الذكي',
  description: 'منصة ذكاء اصطناعي تحلل قراراتك من 9 زوايا متخصصة وتصدر توصية تنفيذية مدعومة بالبيانات',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-arabic antialiased">
        {children}
      </body>
    </html>
  )
}
