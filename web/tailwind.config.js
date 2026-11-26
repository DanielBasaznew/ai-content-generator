/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "#0f172a",
        "surface-card": "#1e293b",
        "surface-border": "#334155",
        accent: {
          DEFAULT: "#38bdf8",
          dark: "#0284c7",
          glow: "rgba(56, 189, 248, 0.15)",
        },
        harar: {
          gold: "#eab308",
          bronze: "#b45309",
          wall: "#78350f",
        }
      },
    },
  },
  plugins: [],
};
