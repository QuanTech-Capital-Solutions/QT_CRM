/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme (Obsidian Navy)
        dark: {
          canvas: '#090A10',
          card: '#111322',
          border: '#1D2138',
          text: '#F4F5F8',
          secondary: '#8A92B2',
          accent: '#8B5CF6',
          success: '#10B981',
          warning: '#F59E0B',
        },
        // Light theme (Alabaster Pearl)
        light: {
          canvas: '#FAFAFC',
          card: '#FFFFFF',
          border: '#E5E8F2',
          text: '#0F111D',
          secondary: '#626987',
          accent: '#6366F1',
          success: '#059669',
          warning: '#D97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        md: '12px',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
