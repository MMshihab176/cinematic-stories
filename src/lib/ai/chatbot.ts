// src/lib/ai/chatbot.ts
// Uses Google Gemini API (free tier) for the story chatbot
import type { ChatMessage } from '@/types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export async function chatWithStory(
  storyId:    string,
  storyTitle: string,
  messages:   ChatMessage[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const systemPrompt = `তুমি "${storyTitle}" গল্পের একজন বুদ্ধিমান সহকারী।
তুমি পাঠকদের এই গল্প সম্পর্কে যেকোনো প্রশ্নের উত্তর দেবে:
- চরিত্র এবং তাদের অনুপ্রেরণা
- গল্পের timeline এবং ঘটনা
- world-building এবং lore
- অধ্যায়ের সারসংক্ষেপ
- চরিত্রদের মধ্যে সম্পর্ক
- থিম এবং প্রতীক

বাংলায় প্রশ্ন করলে বাংলায় উত্তর দাও। ইংরেজিতে প্রশ্ন করলে ইংরেজিতে উত্তর দাও।
গল্পের বাইরের বিষয়ে প্রশ্ন করলে বিনয়ের সাথে জানাও যে তুমি শুধু এই গল্প সম্পর্কে সাহায্য করতে পারবে।`

  // Build conversation history for Gemini
  const geminiMessages = []

  // Add system context as first user message
  geminiMessages.push({
    role: 'user',
    parts: [{ text: systemPrompt }]
  })
  geminiMessages.push({
    role: 'model',
    parts: [{ text: 'বুঝেছি! আমি এই গল্পের সহকারী হিসেবে সাহায্য করব।' }]
  })

  // Add conversation history
  for (const msg of messages) {
    geminiMessages.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message ?? 'Gemini API error')
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')

  return text
}
