// src/lib/ai/chatbot.ts
import Anthropic from '@anthropic-ai/sdk'
import { searchRelevantContext } from './embeddings'
import type { ChatMessage } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function chatWithStory(
  storyId:    string,
  storyTitle: string,
  messages:   ChatMessage[]
): Promise<string> {
  // Get the latest user message to build context
  const latestUser = [...messages].reverse().find(m => m.role === 'user')
  const query = latestUser?.content ?? ''

  // Retrieve relevant story context via RAG
  const contextChunks = await searchRelevantContext(storyId, query)
  const contextBlock = contextChunks.length
    ? `\n\nRelevant story content:\n${contextChunks.map((c, i) => `[${i+1}] ${c}`).join('\n\n')}`
    : ''

  const systemPrompt = `You are an intelligent assistant for the story "${storyTitle}".
Your role is to help readers understand the story by answering questions about:
- Characters and their motivations
- Plot timeline and events
- World-building and lore
- Chapter summaries and recaps
- Relationships between characters
- Themes and symbolism

Only answer based on the story content provided. If the answer is not in the content, say so honestly.
Be engaging and match the tone of the story.${contextBlock}`

  const response = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 800,
    system:     systemPrompt,
    messages:   messages.map(m => ({
      role:    m.role,
      content: m.content,
    })),
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : 'I could not generate a response.'
}
