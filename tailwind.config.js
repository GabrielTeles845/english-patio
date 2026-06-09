/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // usado só pela dashboard (html.dark); o site público nunca recebe .dark
  theme: {
    extend: {
      colors: {
        // ===== tokens da dashboard (DESIGN.md §15.2 — espelham o preview) =====
        brand: { DEFAULT: '#1E3765', light: '#2F539A', 50: '#eef2f9', 700: '#1E3765', 900: '#13243f' },
        wa: '#25D366',
        status: { pending: '#B5860B', sent: '#2F539A', viewed: '#7C3AED', signed: '#16a34a', rejected: '#DC2626', failed: '#EA580C' },
        fam: { fun: '#E8861B', conv: '#E0457B', power: '#2F539A', sprint: '#7C3AED' },
        // ===== tokens do site institucional =====
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
          50: '#fff8e1',      // (dashboard) fundo suave do amarelo
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