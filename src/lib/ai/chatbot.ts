// src/lib/ai/chatbot.ts
// Groq API with automatic story content reading
import type { ChatMessage } from '@/types'
import { createAdminClient } from '@/lib/supabase/server'

// Fetch all published chapter content for a story automatically
async function getStoryContent(storyId: string): Promise<string> {
  try {
    const supabase = createAdminClient()
    
    const { data: chapters } = await supabase
      .from('chapters')
      .select('title, chapter_number, content')
      .eq('story_id', storyId)
      .eq('status', 'published')
      .order('chapter_number', { ascending: true })

    if (!chapters || chapters.length === 0) return ''

    const texts = chapters.map(ch => {
      const text = extractText(ch.content as Record<string, unknown>)
      return `=== অধ্যায় ${ch.chapter_number}: ${ch.title} ===\n${text}`
    })

    return texts.join('\n\n')
  } catch {
    return ''
  }
}

// Extract plain text from TipTap JSON
function extractText(node: Record<string, unknown>): string {
  if (!node) return ''
  if (node.type === 'text') return (node.text as string) ?? ''
  if (Array.isArray(node.content)) {
    const children = (node.content as Record<string, unknown>[]).map(extractText)
    if (node.type === 'paragraph') return children.join('') + '\n'
    return children.join(' ')
  }
  return ''
}

export async function chatWithStory(
  storyId:    string,
  storyTitle: string,
  messages:   ChatMessage[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  // Automatically fetch story content
  const storyContent = await getStoryContent(storyId)
  
  const contentSection = storyContent 
    ? `\n\nগল্পের বিষয়বস্তু:\n${storyContent.slice(0, 6000)}`
    : '\n\n(এখনো কোনো published chapter নেই)'

  const systemPrompt = `তুমি "${storyTitle}" গল্পের একজন বুদ্ধিমান সহকারী।
তুমি নিচের গল্পের বিষয়বস্তু পড়েছ এবং পাঠকদের প্রশ্নের উত্তর দেবে।

তুমি যা করতে পারবে:
- চরিত্র এবং তাদের অনুপ্রেরণা সম্পর্কে বলতে পারবে
- গল্পের timeline এবং ঘটনা ব্যাখ্যা করতে পারবে
- অধ্যায়ের সারসংক্ষেপ দিতে পারবে
- চরিত্রদের মধ্যে সম্পর্ক বর্ণনা করতে পারবে
- থিম এবং প্রতীক বিশ্লেষণ করতে পারবে

বাংলায় প্রশ্ন করলে বাংলায় উত্তর দাও।
গল্পের বাইরের বিষয়ে প্রশ্ন করলে বিনয়ের সাথে বলো যে তুমি শুধু এই গল্প সম্পর্কে সাহায্য করতে পারবে।
${contentSection}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message ?? 'Groq API error')
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from Groq')

  return text
}
