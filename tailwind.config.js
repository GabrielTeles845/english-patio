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
    },
  },
  plugins: [],
} 