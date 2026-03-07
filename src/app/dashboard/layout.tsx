import AppSidebar from '@/components/AppSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <AppSidebar />
      {/* Main content — offset for sidebar on desktop */}
      <main className="md:mr-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
