/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        upstash: {
          green: "#00E9A3",
          dark: "#121212",
          card: "#1E1E1E",
          border: "#2A2A2A",
        },
      },
    },
  },
  plugins: [],
};
