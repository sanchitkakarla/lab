import { DoctorSidebar } from '@/components/portal/DoctorSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export const dynamic = 'force-dynamic'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #faf8ff 35%, #f6fbff 65%, #f8fdff 100%)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div style={{ position: 'absolute', top: '-10%', left: '10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,200,255,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', top: '30%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(210,185,255,0.10) 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '5%', left: '25%', width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,220,255,0.10) 0%, transparent 70%)', filter: 'blur(80px)' }} />
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
