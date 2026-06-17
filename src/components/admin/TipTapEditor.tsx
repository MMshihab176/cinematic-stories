'use client'

import { useCallback, useRef } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExt from '@tiptap/extension-image'
import LinkExt from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import toast from 'react-hot-toast'

interface Props {
  content:  object
  onChange: (json: object) => void
  storyId?: string
}

export function TipTapEditor({ content, onChange, storyId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ImageExt.configure({ inline: false, allowBase64: false }),
      LinkExt.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Begin your chapter — use the toolbar for scene breaks, images and quotes...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: { class: 'tiptap-editor' },
    },
  })

  const insertImage = useCallback(async (file: File) => {
    if (!editor) return
    const formData = new FormData()
    formData.append('file', file)
    if (storyId) formData.append('story_id', storyId)

    const toastId = toast.loading('Uploading image...')
    try {
      const res = await fetch('/api/admin/media', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      editor.chain().focus().setImage({ src: data.asset.file_url, alt: file.name }).run()
      toast.success('Image inserted', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed', { id: toastId })
    }
  }, [editor, storyId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) insertImage(file)
    e.target.value = ''
  }

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return <div className="tiptap-editor flex items-center justify-center text-sm" style={{ color: 'var(--atmo-muted)' }}>Loading editor...</div>
  }

  return (
    <div>
      <Toolbar editor={editor} onInsertImage={() => fileInputRef.current?.click()} onSetLink={setLink} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor, onInsertImage, onSetLink }: { editor: Editor; onInsertImage: () => void; onSetLink: () => void }) {
  const btn = (active: boolean, extra = '') =>
    `px-2.5 py-1.5 rounded text-sm transition-colors ${extra} ${
      active ? 'bg-[#e0c97f] text-[#0a0a0a]' : 'text-[#a8a090] hover:bg-[#1a1a1a] hover:text-[#e8e0d0]'
    }`

  return (
    <div className="flex flex-wrap items-center gap-1 mb-2 p-2 rounded-lg bg-[#101010] border border-[#1e1e1e]">
      <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}>
        <b>B</b>
      </button>
      <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}>
        <i>I</i>
      </button>
      <button type="button" title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))}>
        <s>S</s>
      </button>

      <Divider />

      <button type="button" title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} className={btn(editor.isActive('paragraph'))}>
        P
      </button>
      <button type="button" title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))}>
        H1
      </button>
      <button type="button" title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))}>
        H2
      </button>
      <button type="button" title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))}>
        H3
      </button>

      <Divider />

      <button type="button" title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))}>
        " Quote
      </button>
      <button type="button" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}>
        • List
      </button>
      <button type="button" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))}>
        1. List
      </button>

      <Divider />

      <button type="button" title="Scene break" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)}>
        ✦ Scene Break
      </button>
      <button type="button" title="Link" onClick={onSetLink} className={btn(editor.isActive('link'))}>
        🔗
      </button>
      <button type="button" title="Insert image" onClick={onInsertImage} className={btn(false)}>
        🖼 Image
      </button>

      <Divider />

      <button type="button" title="Undo" onClick={() => editor.chain().focus().undo().run()} className={btn(false)}>
        ↺
      </button>
      <button type="button" title="Redo" onClick={() => editor.chain().focus().redo().run()} className={btn(false)}>
        ↻
      </button>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-[#2a2820] mx-1 shrink-0" />
}
