// src/lib/ai/embeddings.ts
// Generates embeddings via Anthropic and stores them in pgvector
// Note: Anthropic doesn't have a native embedding model yet; we use a simple
// text hash approach here and upgrade to OpenAI embeddings or a local model.
// For production, swap createEmbedding to use OpenAI ada-002 or similar.

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Chunk text into segments of ~500 words
export function chunkText(text: string, chunkSize = 500): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }
  return chunks.filter(c => c.trim().length > 20)
}

// Convert TipTap JSON doc to plain text
export function tiptapToText(doc: object): string {
  const extract = (node: Record<string, unknown>): string => {
    if (node.type === 'text') return (node.text as string) ?? ''
    if (Array.isArray(node.content)) {
      return (node.content as Record<string, unknown>[])
        .map(extract)
        .join(node.type === 'paragraph' ? '\n' : ' ')
    }
    return ''
  }
  return extract(doc as Record<string, unknown>)
}

// Simple deterministic pseudo-embedding for demo (1536-dim)
// REPLACE with real embedding API call in production
function pseudoEmbed(text: string): number[] {
  const vec = new Array(1536).fill(0)
  for (let i = 0; i < text.length; i++) {
    vec[i % 1536] += text.charCodeAt(i) / 255
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
  return vec.map(v => v / norm)
}

export async function indexChapter(
  storyId: string,
  chapterId: string,
  content: object
) {
  const supabase = createAdminClient()
  const text = tiptapToText(content)
  const chunks = chunkText(text)

  // Remove old embeddings for this chapter
  await supabase
    .from('story_embeddings')
    .delete()
    .eq('chapter_id', chapterId)

  for (const chunk of chunks) {
    const embedding = pseudoEmbed(chunk)
    await supabase.from('story_embeddings').insert({
      story_id:   storyId,
      chapter_id: chapterId,
      content:    chunk,
      embedding:  JSON.stringify(embedding),
    })
  }
}

export async function searchRelevantContext(
  storyId: string,
  query: string,
  k = 5
): Promise<string[]> {
  const supabase = createAdminClient()
  const queryEmbedding = pseudoEmbed(query)

  const { data, error } = await supabase.rpc('search_story_embeddings', {
    query_embedding: JSON.stringify(queryEmbedding),
    story_uuid:      storyId,
    match_count:     k,
  })

  if (error || !data) return []
  return (data as { content: string }[]).map(r => r.content)
}
