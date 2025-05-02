/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.css",
    "./src/index.css"
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glassmorphism': 'linear-gradient(180deg, rgba(12, 12, 12, 0.2) 0%, rgba(12, 12, 12, 0.1) 100%)',
        'glass-shine': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
        'glass-glow': 'linear-gradient(45deg, rgba(255, 191, 13, 0.15), transparent)',
      },
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        card: {
          DEFAULT: "#161616",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#161616",
          foreground: "#ffffff",
        },
        primary: {
          DEFAULT: "#FFBF0D",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#1f1f1f",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#27272a",
          foreground: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#00c8ff",
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#f03c3c",
          foreground: "#ffffff",
        },
        border: "#333333",
        input: "#333333",
        ring: "#FFBF0D",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}