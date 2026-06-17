'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import type { AssetType, MediaAsset } from '@/types'

interface Props {
  fileType: AssetType
  storyId?: string
  onSelect: (url: string, asset: MediaAsset) => void
  onClose:  () => void
}

const ACCEPT: Record<AssetType, Record<string, string[]>> = {
  image:    { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
  audio:    { 'audio/*': ['.mp3', '.wav', '.ogg'] },
  pdf:      { 'application/pdf': ['.pdf'] },
  document: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
  other:    {},
}

export function MediaPickerModal({ fileType, storyId, onSelect, onClose }: Props) {
  const [assets,  setAssets]  = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ type: fileType })
    if (storyId) params.set('story_id', storyId)
    const res = await fetch(`/api/admin/media?${params}`)
    const data = await res.json()
    setAssets(data.media ?? [])
    setLoading(false)
  }, [fileType, storyId])

  useEffect(() => { load() }, [load])

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      if (storyId) formData.append('story_id', storyId)

      const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? `Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
    load()
  }, [storyId, load])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT[fileType],
    multiple: true,
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-[#101010] border border-[#2a2820] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
          <h3 className="text-sm font-medium">Select {fileType}</h3>
          <button onClick={onClose} className="text-xl opacity-60 hover:opacity-100">×</button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`m-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-[#e0c97f] bg-[#e0c97f]/5' : 'border-[#2a2820] hover:border-[#3a3830]'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-sm text-[#a8a090]">
            {uploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drag & drop, or click to upload'}
          </p>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <p className="text-center text-sm text-[#6b6555] py-8">Loading...</p>
          ) : assets.length === 0 ? (
            <p className="text-center text-sm text-[#6b6555] py-8">No {fileType} files yet.</p>
          ) : fileType === 'image' ? (
            <div className="grid grid-cols-4 gap-2">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => onSelect(asset.file_url, asset)}
                  className="aspect-[2/3] rounded-lg overflow-hidden border border-[#1e1e1e] hover:border-[#e0c97f] transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.file_url} alt={asset.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {assets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => onSelect(asset.file_url, asset)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-[#1e1e1e] hover:border-[#e0c97f] transition-colors text-sm flex items-center justify-between"
                >
                  <span className="truncate">{asset.label}</span>
                  <span className="text-xs text-[#6b6555] uppercase shrink-0 ml-2">{asset.file_type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
