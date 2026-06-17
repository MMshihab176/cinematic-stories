import { MediaLibrary } from '@/components/admin/MediaLibrary'

export default function AdminMediaPage() {
  return (
    <div className="p-6 sm:p-10 max-w-5xl">
      <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
        Media Library
      </h1>
      <p className="text-sm text-[#6b6555] mb-8">
        Files uploaded here are reusable across all stories — cover images, ambient soundtracks,
        and reference documents.
      </p>
      <MediaLibrary />
    </div>
  )
}
