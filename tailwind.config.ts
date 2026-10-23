import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const color = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: color('background'),
        surface: color('surface'),
        foreground: color('foreground'),
        muted: color('muted'),
        'muted-foreground': color('muted-foreground'),
        border: color('border'),
        input: color('input'),
        ring: color('ring'),
        primary: color('primary'),
        'primary-foreground': color('primary-foreground'),
        'primary-soft': color('primary-soft'),
        destructive: color('destructive'),
        'destructive-soft': color('destructive-soft'),
        success: color('success'),
        canvas: color('canvas'),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Newsreader Variable"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px hsl(215 25% 12% / 0.04), 0 1px 1px hsl(215 25% 12% / 0.03)',
        pop: '0 8px 24px -6px hsl(215 25% 12% / 0.14), 0 2px 6px hsl(215 25% 12% / 0.06)',
        paper: '0 1px 3px hsl(215 25% 12% / 0.08), 0 8px 28px -10px hsl(215 25% 12% / 0.18)',
      },
    },
  },
  plugins: [animate],
};

export default config;
