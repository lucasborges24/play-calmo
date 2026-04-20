/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E53535',
          redPress: '#C42B2B',
          ink: '#111111',
          off: '#F7F7F5',
        },
        background: {
          light: '#F7F7F5',
          dark: '#0D0D0D',
          DEFAULT: '#F7F7F5',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1A1A1A',
        },
        foreground: {
          light: '#111111',
          dark: '#F0F0EE',
        },
        primary: {
          light: '#E53535',
          dark: '#E53535',
          DEFAULT: '#E53535',
        },
        muted: {
          light: '#666666',
          dark: '#8A8A8A',
        },
        border: {
          light: '#EAEAE6',
          dark: '#2C2C2C',
        },
        destructive: {
          light: '#E53535',
          dark: '#E53535',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'System', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
