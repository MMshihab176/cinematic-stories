import Link from 'next/link'
import { StoryForm } from '@/components/admin/StoryForm'

export default function NewStoryPage() {
  return (
    <div className="p-6 sm:p-10 max-w-2xl">
      <Link href="/admin/stories" className="text-xs uppercase tracking-widest text-[#6b6555] hover:text-[#e0c97f] transition-colors">
        ← All Stories
      </Link>
      <h1 className="text-2xl font-semibold mt-3 mb-8" style={{ fontFamily: '"Playfair Display", serif' }}>
        New Story
      </h1>
      <StoryForm mode="create" />
    </div>
  )
}
