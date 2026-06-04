import { Nav } from '@/components/layout/Nav'

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Nav />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
