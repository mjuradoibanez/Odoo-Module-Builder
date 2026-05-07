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
        primary: '#714B67',
        background: '#F7F7F7',
        text: '#714B67',
        border: '#A084A2',
        card: '#fff',
        lightText: '#A084A2',
        accent: '#FFB84D',
        dark: '#222',
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
