import type { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { FontSize } from './font-size';
import { FolioFormat } from './format';
import { PageBreak } from './page-break';

/** Image node with a percentage width and alignment. */
const FolioImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const v = Number(el.getAttribute('data-width'));
          return Number.isFinite(v) && v > 0 ? v : null;
        },
        renderHTML: (a) => (a.width ? { 'data-width': a.width, style: `width: ${a.width}%` } : {}),
      },
      align: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-align'),
        renderHTML: (a) => (a.align ? { 'data-align': a.align } : {}),
      },
    };
  },
});

/**
 * The single source of truth for Folio's document schema. The same list powers the live editor,
 * the miniature template previews and any HTML rendering.
 */
export function getExtensions(options: { placeholder?: string; interactive?: boolean } = {}): Extensions {
  const { placeholder = 'Start writing…', interactive = true } = options;
  const list: Extensions = [
    StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
    Underline,
    TextStyle,
    Color.configure({ types: ['textStyle'] }),
    FontFamily.configure({ types: ['textStyle'] }),
    FontSize,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
    }),
    FolioImage.configure({ inline: false, allowBase64: true }),
    Table.configure({ resizable: interactive }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    PageBreak,
    FolioFormat,
  ];
  if (interactive) list.push(Placeholder.configure({ placeholder }), CharacterCount);
  return list;
}
