// src/lib/ai/chatbot.ts
// Groq API - Free, fast, no billing required
import type { ChatMessage } from '@/types'

export async function chatWithStory(
  storyId:    string,
  storyTitle: string,
  messages:   ChatMessage[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const systemPrompt = `তুমি "${storyTitle}" গল্পের একজন বুদ্ধিমান সহকারী।
তুমি পাঠকদের এই গল্প সম্পর্কে যেকোনো প্রশ্নের উত্তর দেবে:
- চরিত্র এবং তাদের অনুপ্রেরণা
- গল্পের timeline এবং ঘটনা
- অধ্যায়ের সারসংক্ষেপ
- চরিত্রদের মধ্যে সম্পর্ক
- থিম এবং প্রতীক

বাংলায় প্রশ্ন করলে বাংলায় উত্তর দাও। ইংরেজিতে প্রশ্ন করলে ইংরেজিতে উত্তর দাও।
গল্পের বাইরের বিষয়ে প্রশ্ন করলে বিনয়ের সাথে বলো যে তুমি শুধু এই গল্প সম্পর্কে সাহায্য করতে পারবে।`

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
