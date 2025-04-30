import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "flip-pulse": {
          "0%, 100%": {
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
        },
        "flip-down": {
          "0%": {
            transform: "rotateX(0deg)",
            opacity: "1",
          },
          "100%": {
            transform: "rotateX(-90deg)",
            opacity: "0",
          },
        },
        "flip-up": {
          "0%": {
            transform: "rotateX(90deg)",
            opacity: "0",
          },
          "100%": {
            transform: "rotateX(0deg)",
            opacity: "1",
          },
        },
        "orbit-slow": {
          "0%": {
            transform: "rotate(0deg) translateX(10px) rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg) translateX(10px) rotate(-360deg)",
          },
        },
        "orbit-reverse-slow": {
          "0%": {
            transform: "rotate(0deg) translateX(20px) rotate(0deg)",
          },
          "100%": {
            transform: "rotate(-360deg) translateX(20px) rotate(360deg)",
          },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        pulse: {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.85',
            transform: 'scale(1.05)',
          },
        },
        "pulse-slow": {
          '0%, 100%': {
            opacity: '0.8',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.6',
            transform: 'scale(1.1)',
          },
        },
        "fade-in-up": {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        "fade-in-down": {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        "float": {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 5px rgba(255, 191, 13, 0.2)" 
          },
          "50%": { 
            boxShadow: "0 0 15px rgba(255, 191, 13, 0.5), 0 0 30px rgba(255, 191, 13, 0.2)" 
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "flip-pulse": "flip-pulse 0.75s ease-in-out infinite",
        "flip-down": "flip-down 0.25s ease-in forwards",
        "flip-up": "flip-up 0.25s ease-out forwards 0.25s",
        "orbit-slow": "orbit-slow 25s linear infinite",
        "orbit-reverse-slow": "orbit-reverse-slow 30s linear infinite",
        "gradient-x": "gradient-x 15s ease infinite",
        "pulse-slow": "pulse-slow 8s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "fade-in-down": "fade-in-down 0.5s ease-out forwards",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
