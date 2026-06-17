'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/admin',          label: 'Dashboard', icon: '◆' },
  { href: '/admin/stories',  label: 'Stories',   icon: '✦' },
  { href: '/admin/media',    label: 'Media',     icon: '▣' },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <nav className="w-full sm:w-56 shrink-0 border-r border-[#2a2820] bg-[#0d0d0d] flex sm:flex-col">
      <div className="px-5 py-6 hidden sm:block">
        <p className="text-xs uppercase tracking-widest text-[#6b6555]">Admin</p>
        <p className="text-lg font-semibold text-[#e0c97f] truncate" style={{ fontFamily: '"Playfair Display", serif' }}>
          {process.env.NEXT_PUBLIC_SITE_NAME ?? 'My Story Space'}
        </p>
      </div>

      <div className="flex sm:flex-col flex-1 px-2 sm:px-3 gap-1 py-2 sm:py-0">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-[#1a1a1a] text-[#e0c97f]' : 'text-[#a8a090] hover:bg-[#161616] hover:text-[#e8e0d0]'
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="px-3 py-4 hidden sm:block">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#a8a090] hover:bg-[#161616] hover:text-[#e8e0d0] transition-colors"
        >
          ← Sign Out
        </button>
      </div>
    </nav>
  )
}
