/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00D1FF', // Vibrant Cyan
          dark: '#00A3C9',
        },
        secondary: '#0F172A', // Deep Slate
        accent: '#9333EA', // Purple
        terminal: {
          bg: '#020617',
          panel: 'rgba(30, 41, 59, 0.4)',
          border: 'rgba(51, 65, 85, 0.3)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'emphasis': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        'fast': '120ms',
        'standard': '200ms',
        'slow': '400ms',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulse_glow: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0px rgba(34, 197, 94, 0)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' },
        },
        shake_fade: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-3px)' },
          '40%': { transform: 'translateX(3px)' },
          '60%': { transform: 'translateX(-2px)' },
          '80%': { transform: 'translateX(2px)' },
        },
        status_pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
        },
        card_breathe: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(34, 211, 238, 0.1)' },
          '50%': { boxShadow: '0 0 12px rgba(34, 211, 238, 0.25)' },
        },
        slide_flash: {
          '0%': { transform: 'translateY(-5px)', opacity: '0.5' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        badge_bounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        signal_entry: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        highlight_flash: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
        },
        cta_glow_idle: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(34, 211, 238, 0.2)' },
          '50%': { boxShadow: '0 0 12px rgba(34, 211, 238, 0.4)' },
        }
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'pulse-glow': 'pulse_glow 0.6s ease-out',
        'shake-fade': 'shake_fade 0.4s ease-out',
        'status-pulse': 'status_pulse 1.5s ease-in-out infinite',
        'card-breathe': 'card_breathe 3s ease-in-out infinite',
        'slide-flash': 'slide_flash 0.3s ease-out',
        'badge-bounce': 'badge_bounce 0.4s ease-out',
        'signal-entry': 'signal_entry 0.3s ease-out',
        'highlight-flash': 'highlight_flash 0.6s ease-out',
        'cta-idle': 'cta_glow_idle 2.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
