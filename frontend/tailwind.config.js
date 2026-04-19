/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Backgrounds ── */
        bg:       '#F7F8FA',
        surface:  '#FFFFFF',
        card:     '#FFFFFF',
        elevated: '#F3F4F6',

        /* ── Borders ── */
        border: {
          DEFAULT: '#E5E7EB',
          light:   '#F3F4F6',
          strong:  '#D1D5DB',
        },

        /* ── Text / Ink ── */
        ink: {
          DEFAULT: '#111827',
          sub:     '#374151',
          muted:   '#6B7280',
          faint:   '#9CA3AF',
        },

        /* ── Primary — deep professional blue ── */
        primary: {
          DEFAULT: '#1D4ED8',
          light:   '#3B82F6',
          dark:    '#1E3A8A',
          bg:      '#EFF6FF',
          border:  '#BFDBFE',
        },

        /* ── Status ── */
        success: { DEFAULT: '#059669', bg: '#ECFDF5', border: '#A7F3D0', light: '#10B981' },
        warning: { DEFAULT: '#D97706', bg: '#FFFBEB', border: '#FDE68A', light: '#F59E0B' },
        danger:  { DEFAULT: '#DC2626', bg: '#FEF2F2', border: '#FECACA', light: '#EF4444' },
        info:    { DEFAULT: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', light: '#3B82F6' },
      },

      boxShadow: {
        card:      '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        modal:     '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
        btn:       '0 1px 2px rgba(0,0,0,0.08)',
      },

      animation: {
        'slide-up':  'slideUp 0.22s ease-out',
        'fade-in':   'fadeIn 0.18s ease-out',
        'scale-in':  'scaleIn 0.20s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp:  { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:   { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        scaleIn:  { '0%': { opacity: 0, transform: 'scale(0.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        pulseDot: { '0%, 100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.5, transform: 'scale(0.8)' } },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
