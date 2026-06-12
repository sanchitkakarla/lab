import { Skeleton } from '@/components/ui/skeleton'

export default function PortalLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-36 mb-6" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 flex gap-8">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-gray-50 px-4 py-3 flex gap-8 items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
