import { DoctorSidebar } from '@/components/portal/DoctorSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export const dynamic = 'force-dynamic'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #dde8ff 0%, #e8d8ff 30%, #cfe8ff 60%, #d4f0f8 100%)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div style={{ position: 'absolute', top: '-10%', left: '5%',   width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,180,255,0.45) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '25%',  right: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,140,255,0.40) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '0%',left: '20%',  width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,200,255,0.38) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <DoctorSidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
          <main className="flex-1 overflow-auto p-6 h-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
