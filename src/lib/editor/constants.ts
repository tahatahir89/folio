export const DEFAULT_FONT_LABEL = 'Arial';
export const DEFAULT_FONT_SIZE = 11;

export const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Calibri', value: "Calibri, Carlito, 'Segoe UI', Arial, sans-serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Cambria', value: 'Cambria, Georgia, serif' },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
] as const;

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72] as const;

export const FONT_WEIGHTS = [
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
] as const;

export const LINE_HEIGHTS = [1, 1.15, 1.25, 1.5, 2, 2.5, 3] as const;
export const DEFAULT_LINE_HEIGHT = 1.5;
export const SPACE_AFTER = [0, 4, 8, 12, 16, 24] as const;
export const DEFAULT_SPACE_AFTER = 8;

export const TEXT_COLORS = [
  ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#FFFFFF'],
  ['#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#0891B2', '#2563EB', '#7C3AED', '#DB2777'],
  ['#991B1B', '#9A3412', '#854D0E', '#166534', '#155E75', '#1E40AF', '#5B21B6', '#9D174D'],
  ['#F87171', '#FB923C', '#FACC15', '#4ADE80', '#22D3EE', '#60A5FA', '#A78BFA', '#F472B6'],
  ['#FECACA', '#FED7AA', '#FEF08A', '#BBF7D0', '#A5F3FC', '#BFDBFE', '#DDD6FE', '#FBCFE8'],
] as const;

export const HIGHLIGHT_COLORS = ['#FEF08A', '#BBF7D0', '#A5F3FC', '#FBCFE8', '#FED7AA', '#DDD6FE', '#E5E7EB', '#FECACA'] as const;

/** Default pt size of each block style, shown in the size box when no explicit size is set. */
export const BLOCK_DEFAULT_SIZE: Record<string, number> = { h1: 20, h2: 16, h3: 14, h4: 12, title: 28, subtitle: 14 };

export const PAGE_PX = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
} as const;

export const MARGIN_PX = { narrow: 48, normal: 96, wide: 144 } as const;
