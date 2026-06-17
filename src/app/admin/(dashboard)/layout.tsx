import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e0d0] flex flex-col sm:flex-row">
      <AdminNav />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
