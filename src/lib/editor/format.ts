import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    folioFormat: {
      setLineHeight: (value: number | null) => ReturnType;
      setSpaceAfter: (points: number | null) => ReturnType;
      setDocStyle: (style: 'title' | 'subtitle' | null) => ReturnType;
      increaseIndent: () => ReturnType;
      decreaseIndent: () => ReturnType;
    };
  }
}

const BLOCKS = ['paragraph', 'heading'];
export const INDENT_PT = 36;
const MAX_INDENT = 8;

function ptFrom(value: string): number | null {
  const m = /^(-?\d+(?:\.\d+)?)(pt|px)$/.exec(value.trim());
  if (!m) return null;
  return m[2] === 'px' ? Number(m[1]) * 0.75 : Number(m[1]);
}

/** Line spacing, paragraph spacing, indentation and Title/Subtitle styles for paragraphs and headings. */
export const FolioFormat = Extension.create({
  name: 'folioFormat',

  addGlobalAttributes() {
    return [
      {
        types: BLOCKS,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) => {
              const v = parseFloat(el.style.lineHeight);
              return Number.isFinite(v) && v > 0 && v < 5 && !/(px|pt|em|%)$/.test(el.style.lineHeight) ? v : null;
            },
            renderHTML: (a) => (a.lineHeight ? { style: `line-height: ${a.lineHeight}` } : {}),
          },
          spaceAfter: {
            default: null,
            parseHTML: (el) => {
              const v = el.style.marginBottom ? ptFrom(el.style.marginBottom) : null;
              return v !== null && v >= 0 && v <= 200 ? Math.round(v) : null;
            },
            renderHTML: (a) => (a.spaceAfter !== null && a.spaceAfter !== undefined ? { style: `margin-bottom: ${a.spaceAfter}pt` } : {}),
          },
          indent: {
            default: 0,
            parseHTML: (el) => {
              const v = el.style.marginLeft ? ptFrom(el.style.marginLeft) : null;
              return v ? Math.max(0, Math.min(MAX_INDENT, Math.round(v / INDENT_PT))) : 0;
            },
            renderHTML: (a) => (a.indent ? { style: `margin-left: ${a.indent * INDENT_PT}pt` } : {}),
          },
        },
      },
      {
        types: ['paragraph'],
        attributes: {
          docStyle: {
            default: null,
            parseHTML: (el) => {
              const v = el.getAttribute('data-doc-style');
              return v === 'title' || v === 'subtitle' ? v : null;
            },
            renderHTML: (a) => (a.docStyle ? { 'data-doc-style': a.docStyle } : {}),
          },
        },
      },
    ];
  },

  addCommands() {
    const shift =
      (delta: number) =>
      () =>
      ({ editor, commands, state, tr, dispatch }: import('@tiptap/core').CommandProps) => {
        if (editor.isActive('taskItem')) return delta > 0 ? commands.sinkListItem('taskItem') : commands.liftListItem('taskItem');
        if (editor.isActive('listItem')) return delta > 0 ? commands.sinkListItem('listItem') : commands.liftListItem('listItem');
        let changed = false;
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
          if (!BLOCKS.includes(node.type.name)) return true;
          const current = (node.attrs.indent as number) || 0;
          const next = Math.max(0, Math.min(MAX_INDENT, current + delta));
          if (next !== current) {
            changed = true;
            if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
          }
          return false;
        });
        return changed;
      };

    return {
      setLineHeight:
        (value) =>
        ({ chain }) =>
          chain().updateAttributes('paragraph', { lineHeight: value }).updateAttributes('heading', { lineHeight: value }).run(),
      setSpaceAfter:
        (points) =>
        ({ chain }) =>
          chain().updateAttributes('paragraph', { spaceAfter: points }).updateAttributes('heading', { spaceAfter: points }).run(),
      setDocStyle:
        (style) =>
        ({ editor, chain }) => {
          if (editor.isActive('paragraph')) return chain().updateAttributes('paragraph', { docStyle: style }).run();
          return chain().setParagraph().updateAttributes('paragraph', { docStyle: style }).run();
        },
      increaseIndent: shift(1),
      decreaseIndent: shift(-1),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-]': () => this.editor.commands.increaseIndent(),
      'Mod-[': () => this.editor.commands.decreaseIndent(),
    };
  },
});
