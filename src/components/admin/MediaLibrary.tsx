'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import type { AssetType, MediaAsset } from '@/types'
import { formatBytes } from '@/lib/utils'

const TABS: { label: string; value: AssetType | 'all' }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Images',    value: 'image' },
  { label: 'Audio',     value: 'audio' },
  { label: 'PDFs',      value: 'pdf' },
  { label: 'Documents', value: 'document' },
]

export function MediaLibrary() {
  const [assets,   setAssets]   = useState<MediaAsset[]>([])
  const [tab,      setTab]      = useState<AssetType | 'all'>('all')
  const [loading,  setLoading]  = useState(true)
  const [uploading,setUploading]= useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = tab !== 'all' ? `?type=${tab}` : ''
    const res = await fetch(`/api/admin/media${params}`)
    const data = await res.json()
    setAssets(data.media ?? [])
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? `Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
    load()
  }, [load])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true })

  const remove = async (asset: MediaAsset) => {
    if (!confirm(`Delete "${asset.label}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/media?id=${asset.id}`, { method: 'DELETE' })
    if (res.ok) {
      setAssets(prev => prev.filter(a => a.id !== asset.id))
      toast.success('Deleted')
    } else {
      toast.error('Delete failed')
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              tab === t.value ? 'bg-[#e0c97f] text-[#0a0a0a] border-[#e0c97f]' : 'border-[#2a2820] text-[#a8a090] hover:bg-[#161616]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`mb-6 p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-[#e0c97f] bg-[#e0c97f]/5' : 'border-[#2a2820] hover:border-[#3a3830]'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-[#a8a090]">
          {uploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drag & drop files, or click to upload'}
        </p>
        <p className="text-xs text-[#6b6555] mt-1">Images, audio (MP3 / WAV / OGG), PDF, DOCX — up to 50MB each</p>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-[#6b6555]">Loading...</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-[#6b6555]">No files in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {assets.map(asset => (
            <div key={asset.id} className="rounded-lg border border-[#1e1e1e] bg-[#101010] overflow-hidden flex flex-col">
              {asset.file_type === 'image' ? (
                <div className="aspect-square bg-[#0a0a0a]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.file_url} alt={asset.label} className="w-full h-full object-cover" />
                </div>
              ) : asset.file_type === 'audio' ? (
                <div className="p-3">
                  <audio src={asset.file_url} controls preload="none" className="w-full h-8" />
                </div>
              ) : (
                <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center">
                  <span className="text-3xl text-[#3a3830]">▤</span>
                </div>
              )}

              <div className="p-2.5 mt-auto">
                <p className="text-xs truncate" title={asset.label}>{asset.label}</p>
                <p className="text-xs text-[#6b6555] mb-2">{formatBytes(asset.size_bytes)}</p>
                <div className="flex gap-2">
                  <button onClick={() => copyUrl(asset.file_url)} className="text-xs text-[#e0c97f] hover:underline">Copy URL</button>
                  <button onClick={() => remove(asset)} className="text-xs text-red-400 hover:underline ml-auto">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
