'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useEffect, useCallback } from 'react'
import { css } from '@/styled-system/css'
import { Button } from './button'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  UnderlineIcon,
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export const RichTextEditor = ({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: css({
          padding: '12px',
          minHeight: '200px',
          maxHeight: '500px',
          overflowY: 'auto',
          border: '1px solid',
          borderColor: 'gray.300',
          borderRadius: 'md',
          outline: 'none',
          '&:focus': {
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px var(--colors-blue-500)',
          },
        }),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update editor content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={css({ width: '100%' })}>
      {/* Toolbar */}
      <div
        className={css({
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          padding: 2,
          borderBottom: '1px solid',
          borderColor: 'gray.300',
          backgroundColor: 'gray.50',
          borderTopLeftRadius: 'md',
          borderTopRightRadius: 'md',
        })}
      >
        {/* Text Formatting */}
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bold') ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <Bold size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('italic') ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <Italic size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('underline') ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <UnderlineIcon size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('strike') ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <Strikethrough size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('code') ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <Code size={16} />
        </Button>

        {/* Separator */}
        <div className={css({ width: '1px', height: '28px', backgroundColor: 'gray.300', mx: 1 })} />

        {/* Headings */}
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <Heading2 size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 3 }) ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <Heading3 size={16} />
        </Button>

        {/* Separator */}
        <div className={css({ width: '1px', height: '28px', backgroundColor: 'gray.300', mx: 1 })} />

        {/* Lists */}
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bulletList') ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <List size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('orderedList') ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <ListOrdered size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('blockquote') ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <Quote size={16} />
        </Button>

        {/* Separator */}
        <div className={css({ width: '1px', height: '28px', backgroundColor: 'gray.300', mx: 1 })} />

        {/* Text Alignment */}
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: 'left' }) ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <AlignLeft size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: 'center' }) ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <AlignCenter size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: 'right' }) ? 'solid' : 'outline'}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <AlignRight size={16} />
        </Button>

        {/* Separator */}
        <div className={css({ width: '1px', height: '28px', backgroundColor: 'gray.300', mx: 1 })} />

        {/* Link & Image */}
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('link') ? 'solid' : 'outline'}
          onClick={setLink}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <LinkIcon size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addImage}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <ImageIcon size={16} />
        </Button>

        {/* Separator */}
        <div className={css({ width: '1px', height: '28px', backgroundColor: 'gray.300', mx: 1 })} />

        {/* Undo/Redo */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <Undo size={16} />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={css({ minWidth: '36px', padding: '4px' })}
        >
          <Redo size={16} />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor}
        className={css({
          '& .ProseMirror': {
            outline: 'none',
          },
          '& .ProseMirror p.is-editor-empty:first-of-type::before': {
            color: 'gray.400',
            content: 'attr(data-placeholder)',
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
          '& .ProseMirror h2': {
            fontSize: '1.5em',
            fontWeight: 'bold',
            marginTop: '0.5em',
            marginBottom: '0.5em',
          },
          '& .ProseMirror h3': {
            fontSize: '1.25em',
            fontWeight: 'bold',
            marginTop: '0.5em',
            marginBottom: '0.5em',
          },
          '& .ProseMirror ul, & .ProseMirror ol': {
            paddingLeft: '1.5em',
            marginTop: '0.5em',
            marginBottom: '0.5em',
          },
          '& .ProseMirror blockquote': {
            borderLeft: '3px solid',
            borderColor: 'gray.300',
            paddingLeft: '1em',
            marginLeft: 0,
            fontStyle: 'italic',
          },
          '& .ProseMirror code': {
            backgroundColor: 'gray.100',
            padding: '0.2em 0.4em',
            borderRadius: 'sm',
            fontSize: '0.9em',
          },
          '& .ProseMirror img': {
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '1em 0',
          },
        })}
      />
    </div>
  )
}

