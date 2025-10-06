/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS custom properties for theme colors
        'theme-bg-primary': 'var(--color-bg-primary)',
        'theme-bg-secondary': 'var(--color-bg-secondary)',
        'theme-bg-tertiary': 'var(--color-bg-tertiary)',
        'theme-bg-elevated': 'var(--color-bg-elevated)',
        'theme-text-primary': 'var(--color-text-primary)',
        'theme-text-secondary': 'var(--color-text-secondary)',
        'theme-text-muted': 'var(--color-text-muted)',
        'theme-text-accent': 'var(--color-text-accent)',
        'theme-border-primary': 'var(--color-border-primary)',
        'theme-border-secondary': 'var(--color-border-secondary)',
        'theme-border-accent': 'var(--color-border-accent)',
        'theme-interactive-primary': 'var(--color-interactive-primary)',
        'theme-interactive-primary-hover': 'var(--color-interactive-primary-hover)',
        'theme-interactive-secondary': 'var(--color-interactive-secondary)',
        'theme-interactive-secondary-hover': 'var(--color-interactive-secondary-hover)',
        'theme-interactive-danger': 'var(--color-interactive-danger)',
        'theme-interactive-danger-hover': 'var(--color-interactive-danger-hover)',
        'theme-status-success': 'var(--color-status-success)',
        'theme-status-warning': 'var(--color-status-warning)',
        'theme-status-error': 'var(--color-status-error)',
        'theme-status-info': 'var(--color-status-info)',
      },
      fontFamily: {
        'theme-primary': 'var(--font-primary)',
        'theme-secondary': 'var(--font-secondary)',
        'theme-mono': 'var(--font-mono)',
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
        'theme-glow': 'var(--shadow-glow)',
      },
      transitionDuration: {
        'theme-fast': 'var(--animation-fast)',
        'theme-normal': 'var(--animation-normal)',
        'theme-slow': 'var(--animation-slow)',
      },
      animation: {
        'stage-lights': 'stage-lights-rotation 20s linear infinite',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'fade-in-down': 'fadeInDown 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
      keyframes: {
        'stage-lights-rotation': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        'fadeInUp': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'fadeInDown': {
          'from': { opacity: '0', transform: 'translateY(-20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'slideInLeft': {
          'from': { opacity: '0', transform: 'translateX(-20px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        'slideInRight': {
          'from': { opacity: '0', transform: 'translateX(20px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        'scaleIn': {
          'from': { opacity: '0', transform: 'scale(0.9)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        'bounceIn': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}