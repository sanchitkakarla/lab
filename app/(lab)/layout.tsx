import { AppSidebar } from '@/components/lab/Sidebar'

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full" style={{ background: 'linear-gradient(135deg, #d4e4f7 0%, #ddd5f5 30%, #cce3f9 60%, #d8eef8 85%, #e2f0f5 100%)' }}>
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
