import { DoctorSidebar } from '@/components/portal/DoctorSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export const dynamic = 'force-dynamic'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
        <DoctorSidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-auto p-6 h-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
