import { AppSidebar } from '@/components/lab/Sidebar'

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #c8d8f0 0%, #d4c8ef 30%, #bdd8f5 60%, #cce8f2 100%)' }}>
      {/* Floating colour orbs — these blur through the glass cards */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', top: '-10%', left: '10%',  width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,190,255,0.55) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '30%',  right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,168,255,0.50) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '25%', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(144,210,255,0.45) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '60%',  left: '55%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,230,200,0.40) 0%, transparent 70%)', filter: 'blur(40px)' }} />
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
