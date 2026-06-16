import { AppSidebar } from '@/components/lab/Sidebar'

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 35%, #eef6ff 65%, #f0faff 100%)' }}>
      {/* Floating colour orbs — subtle pastels so glass reads clearly on near-white bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', top: '-10%', left: '10%',  width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,200,255,0.30) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: '30%',  right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(210,185,255,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '25%', width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,220,255,0.22) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0 relative">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
