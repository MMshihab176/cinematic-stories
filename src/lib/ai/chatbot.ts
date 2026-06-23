// src/lib/ai/chatbot.ts
// Google Gemini API - works with AQ. format keys via v1alpha endpoint
import type { ChatMessage } from '@/types'

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
- অধ্যায়ের সারসংক্ষেপ
- চরিত্রদের মধ্যে সম্পর্ক
- থিম এবং প্রতীক

বাংলায় প্রশ্ন করলে বাংলায় উত্তর দাও। ইংরেজিতে প্রশ্ন করলে ইংরেজিতে উত্তর দাও।`

  const contents = []
  contents.push({ role: 'user', parts: [{ text: systemPrompt }] })
  contents.push({ role: 'model', parts: [{ text: 'বুঝেছি, আমি এই গল্পের সহকারী হিসেবে সাহায্য করব।' }] })

  for (const msg of messages) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })
  }

  const body = JSON.stringify({
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
  })

  // Try multiple endpoints — AQ. keys work on v1alpha, AIzaSy keys work on v1beta
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
  ]

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      })

      if (!response.ok) {
        const err = await response.json()
        console.error('Gemini endpoint error:', url, err.error?.message)
        continue
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text

    } catch (e) {
      console.error('Gemini fetch failed:', url, e)
      continue
    }
  }

  throw new Error('All Gemini endpoints failed')
}
