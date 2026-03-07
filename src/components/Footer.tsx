'use client'

export default function Footer() {
  return (
    <footer
      className="relative py-12 border-t"
      style={{
        background: '#050709',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A853] to-[#E8C97A] flex items-center justify-center">
              <span className="text-[#07090F] font-bold text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                AB
              </span>
            </div>
            <span
              className="text-lg font-bold gold-text"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              Advisory Board
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {[
              { label: 'عن المنصة', href: '#' },
              { label: 'كيف تعمل', href: '#how-it-works' },
              { label: 'التسعير', href: '#' },
              { label: 'التواصل', href: '#' }
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-300 hover:text-[#D4A853]"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Powered by */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-3 py-1.5 rounded-full border"
              style={{
                color: 'var(--text-muted)',
                borderColor: 'var(--border)',
                background: 'rgba(255,255,255,0.02)',
                fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              }}
            >
              مدعوم بالذكاء الاصطناعي من{' '}
              <span style={{ color: 'var(--accent-gold)' }}>Anthropic</span>
            </span>
          </div>
        </div>

        {/* Bottom line */}
        <div
          className="mt-8 pt-6 text-center text-xs border-t"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
            fontFamily: 'IBM Plex Sans Arabic, sans-serif',
          }}
        >
          © 2025 Advisory Board. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  )
}
