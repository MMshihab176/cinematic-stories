export function slugify(text: string): string {
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (cleaned.length === 0) {
    return `story-${Math.random().toString(36).slice(2, 8)}`
  }
  return cleaned
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function wordCountFromTipTap(doc: object): number {
  const extract = (node: Record<string, unknown>): string => {
    if (node.type === 'text') return (node.text as string) ?? ''
    if (Array.isArray(node.content)) {
      return (node.content as Record<string, unknown>[]).map(extract).join(' ')
    }
    return ''
  }
  const text = extract(doc as Record<string, unknown>)
  return text.split(/\s+/).filter(Boolean).length
}
