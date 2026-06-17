export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars
    .replace(/[\s_]+/g, '-')    // spaces/underscores -> hyphen
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-|-$/g, '')      // trim leading/trailing hyphens
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
