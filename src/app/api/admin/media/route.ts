import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminSession, unauthorizedResponse } from '@/lib/admin-session'
import type { AssetType } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const BUCKETS: Record<AssetType, string> = {
  image:    'story-media',
  audio:    'audio-tracks',
  pdf:      'documents',
  document: 'documents',
  other:    'documents',
}

function detectAssetType(mime: string): AssetType {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime === 'application/pdf') return 'pdf'
  if (
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) return 'document'
  return 'other'
}

// GET /api/admin/media?type=image&story_id=... — list assets
export async function GET(req: NextRequest) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const { searchParams } = new URL(req.url)
  const type    = searchParams.get('type')
  const storyId = searchParams.get('story_id')

  const supabase = createAdminClient()
  let query = supabase.from('media_assets').select('*').order('created_at', { ascending: false })

  if (type)    query = query.eq('file_type', type)
  if (storyId) query = query.eq('story_id', storyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ media: data })
}

// POST /api/admin/media — upload a new file (multipart/form-data)
export async function POST(req: NextRequest) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const formData = await req.formData()
  const file    = formData.get('file') as File | null
  const label   = (formData.get('label') as string | null) ?? ''
  const storyId = (formData.get('story_id') as string | null) || null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // 50MB limit
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 413 })
  }

  const assetType = detectAssetType(file.type)
  const bucket    = BUCKETS[assetType]

  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${assetType}/${uuidv4()}.${ext}`

  const supabase = createAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, cacheControl: '31536000' })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      story_id:   storyId,
      label:      label || file.name,
      file_url:   urlData.publicUrl,
      file_type:  assetType,
      mime_type:  file.type,
      size_bytes: file.size,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ asset: data }, { status: 201 })
}

// DELETE /api/admin/media?id=... — remove from storage + DB
export async function DELETE(req: NextRequest) {
  if (!(await requireAdminSession())) return unauthorizedResponse()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: asset } = await supabase.from('media_assets').select('*').eq('id', id).single()
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  // Derive storage path from public URL
  const bucket = BUCKETS[asset.file_type as AssetType]
  const marker = `/object/public/${bucket}/`
  const idx = (asset.file_url as string).indexOf(marker)
  if (idx !== -1) {
    const path = (asset.file_url as string).slice(idx + marker.length)
    await supabase.storage.from(bucket).remove([path])
  }

  const { error } = await supabase.from('media_assets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
