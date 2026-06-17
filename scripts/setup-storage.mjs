// scripts/setup-storage.mjs
//
// One-time setup: creates the three public storage buckets this project needs.
// Run after creating your Supabase project and applying the SQL migrations:
//
//   node scripts/setup-storage.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your
// environment (e.g. `export $(grep -v '^#' .env.local | xargs)` first, or
// use a tool like `dotenv-cli`).

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const BUCKETS = [
  { id: 'story-media',  public: true, fileSizeLimit: 52428800 }, // 50MB — cover/inline images
  { id: 'audio-tracks', public: true, fileSizeLimit: 52428800 }, // 50MB — BGM/ambient audio
  { id: 'documents',    public: true, fileSizeLimit: 52428800 }, // 50MB — PDFs / DOCX
]

for (const bucket of BUCKETS) {
  const { data: existing } = await supabase.storage.getBucket(bucket.id)

  if (existing) {
    console.log(`✓ Bucket "${bucket.id}" already exists — skipping`)
    continue
  }

  const { error } = await supabase.storage.createBucket(bucket.id, {
    public:        bucket.public,
    fileSizeLimit: bucket.fileSizeLimit,
  })

  if (error) {
    console.error(`✗ Failed to create bucket "${bucket.id}":`, error.message)
  } else {
    console.log(`✓ Created public bucket "${bucket.id}"`)
  }
}

console.log('\nDone. Buckets are public-read; all writes go through the service-role key via /api/admin/media.')
