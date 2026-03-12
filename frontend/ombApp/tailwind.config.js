/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#1ed760',
        background: '#000',
        text: '#fff',
        border: '#222',
        card: '#232323',
        lightText: '#b3b3b3',
      },
      fontFamily: {
        bold: ['Montserrat-Bold'],
        regular: ['Montserrat-Regular'],
        light: ['Montserrat-Light'],
      },
    },
  },
  plugins: [],
}