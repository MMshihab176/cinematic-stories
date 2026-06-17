'use client'

import React from 'react'

interface TTMark {
  type: string
  attrs?: Record<string, unknown>
}

interface TTNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TTNode[]
  text?: string
  marks?: TTMark[]
}

function applyMarks(text: string, marks: TTMark[] | undefined, key: string | number): React.ReactNode {
  if (!marks || marks.length === 0) return text

  return marks.reduce<React.ReactNode>((acc, mark) => {
    switch (mark.type) {
      case 'bold':
        return <strong key={`${key}-b`}>{acc}</strong>
      case 'italic':
        return <em key={`${key}-i`}>{acc}</em>
      case 'underline':
        return <u key={`${key}-u`}>{acc}</u>
      case 'strike':
        return <s key={`${key}-s`}>{acc}</s>
      case 'code':
        return (
          <code key={`${key}-c`} className="px-1 py-0.5 rounded text-sm" style={{ background: 'var(--atmo-surface)' }}>
            {acc}
          </code>
        )
      case 'link':
        return (
          <a
            key={`${key}-l`}
            href={(mark.attrs?.href as string) ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--atmo-accent)', textDecoration: 'underline' }}
          >
            {acc}
          </a>
        )
      default:
        return acc
    }
  }, text)
}

function renderNode(node: TTNode, key: string | number): React.ReactNode {
  switch (node.type) {
    case 'doc':
      return <React.Fragment key={key}>{node.content?.map((n, i) => renderNode(n, i))}</React.Fragment>

    case 'paragraph': {
      if (!node.content || node.content.length === 0) {
        return <p key={key}>&nbsp;</p>
      }
      return <p key={key}>{node.content.map((n, i) => renderNode(n, `${key}-${i}`))}</p>
    }

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 2
      const content = node.content?.map((n, i) => renderNode(n, `${key}-${i}`))
      switch (level) {
        case 1: return <h1 key={key}>{content}</h1>
        case 2: return <h2 key={key}>{content}</h2>
        case 3: return <h3 key={key}>{content}</h3>
        default: return <h4 key={key}>{content}</h4>
      }
    }

    case 'blockquote':
      return (
        <blockquote key={key}>
          {node.content?.map((n, i) => renderNode(n, `${key}-${i}`))}
        </blockquote>
      )

    case 'bulletList':
      return (
        <ul key={key} className="list-disc pl-6 mb-6 space-y-1">
          {node.content?.map((n, i) => renderNode(n, `${key}-${i}`))}
        </ul>
      )

    case 'orderedList':
      return (
        <ol key={key} className="list-decimal pl-6 mb-6 space-y-1">
          {node.content?.map((n, i) => renderNode(n, `${key}-${i}`))}
        </ol>
      )

    case 'listItem':
      return <li key={key}>{node.content?.map((n, i) => renderNode(n, `${key}-${i}`))}</li>

    case 'codeBlock':
      return (
        <pre
          key={key}
          className="p-4 rounded-lg overflow-x-auto mb-6 text-sm"
          style={{ background: 'var(--atmo-surface)', border: '1px solid var(--atmo-border)' }}
        >
          <code>{node.content?.map(c => c.text).join('')}</code>
        </pre>
      )

    case 'image': {
      const src = node.attrs?.src as string | undefined
      const alt = (node.attrs?.alt as string) ?? ''
      const title = node.attrs?.title as string | undefined
      if (!src) return null
      return (
        <figure key={key} className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" />
          {title && (
            <figcaption
              className="text-center text-sm mt-2 italic"
              style={{ color: 'var(--atmo-muted)' }}
            >
              {title}
            </figcaption>
          )}
        </figure>
      )
    }

    // horizontalRule -> cinematic scene break
    case 'horizontalRule':
      return (
        <div key={key} className="scene-break" aria-hidden="true">
          ✦ &nbsp; ✦ &nbsp; ✦
        </div>
      )

    case 'hardBreak':
      return <br key={key} />

    case 'text':
      return <React.Fragment key={key}>{applyMarks(node.text ?? '', node.marks, key)}</React.Fragment>

    default:
      // Unknown node — try to render children if present
      if (node.content) {
        return <React.Fragment key={key}>{node.content.map((n, i) => renderNode(n, `${key}-${i}`))}</React.Fragment>
      }
      return null
  }
}

export function TipTapRenderer({ content }: { content: object }) {
  const doc = content as TTNode
  if (!doc || doc.type !== 'doc') {
    return <p style={{ color: 'var(--atmo-muted)' }}>This chapter has no content yet.</p>
  }
  return <>{renderNode(doc, 'root')}</>
}
