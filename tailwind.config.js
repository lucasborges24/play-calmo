/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F6F7FB',
          dark: '#09090B',
        },
        foreground: {
          light: '#111827',
          dark: '#F8FAFC',
        },
        primary: {
          light: '#0F766E',
          dark: '#2DD4BF',
        },
        muted: {
          light: '#6B7280',
          dark: '#94A3B8',
        },
        border: {
          light: '#E5E7EB',
          dark: '#27272A',
        },
        destructive: {
          light: '#DC2626',
          dark: '#F87171',
        },
      },
    },
  },
  plugins: [],
};
