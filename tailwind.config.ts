import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['IBM Plex Sans Arabic', 'sans-serif'],
        heading: ['Tajawal', 'sans-serif'],
      },
      colors: {
        'bg-primary': '#07090F',
        'bg-secondary': '#0D1117',
        'bg-card': '#131820',
        'bg-card-hover': '#1A2233',
        'accent-gold': '#D4A853',
        'accent-gold-light': '#E8C97A',
        'accent-blue': '#2563EB',
        'accent-blue-glow': '#3B82F6',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        border: '#1E293B',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #D4A853 0%, #F5E6B8 50%, #D4A853 100%)',
        'gradient-dark': 'linear-gradient(180deg, #07090F 0%, #0D1117 100%)',
      },
      boxShadow: {
        'glow-gold': '0 0 30px rgba(212, 168, 83, 0.15)',
        'glow-gold-lg': '0 0 60px rgba(212, 168, 83, 0.25)',
        'glow-blue': '0 0 30px rgba(37, 99, 235, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
