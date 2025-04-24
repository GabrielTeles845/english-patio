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
          DEFAULT: '#1E3765', // Azul Escuro
          light: '#2F539A',   // Azul mais claro
        },
        secondary: {
          DEFAULT: '#F5B700', // Amarelo
          light: '#FFE17A',   // Amarelo pastel
        },
        accent: {
          DEFAULT: '#F5B700', // Amarelo
          light: '#FFE17A',   // Amarelo pastel
        },
        background: {
          DEFAULT: '#FFFFFF', // Branco
          light: '#F8F9FA',   // Cinza claro
        },
      },
      fontFamily: {
        sans: ['Comic Neue', 'cursive'],
        heading: ['Fredoka One', 'cursive'],
      },
      backgroundImage: {
        'hero-pattern': "url('/src/assets/hero-bg.jpg')",
        'about-pattern': "url('/src/assets/about-bg.jpg')",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} 