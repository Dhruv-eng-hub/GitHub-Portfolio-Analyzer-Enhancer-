/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(240 10% 4%)',
        foreground: 'hsl(0 0% 98%)',
        card: 'hsl(240 10% 6%)',
        'card-foreground': 'hsl(0 0% 98%)',
        popover: 'hsl(240 10% 6%)',
        'popover-foreground': 'hsl(0 0% 98%)',
        primary: 'hsl(72 100% 50%)',
        'primary-foreground': 'hsl(0 0% 0%)',
        secondary: 'hsl(240 5% 20%)',
        'secondary-foreground': 'hsl(0 0% 98%)',
        muted: 'hsl(240 5% 15%)',
        'muted-foreground': 'hsl(240 5% 65%)',
        accent: 'hsl(240 5% 20%)',
        'accent-foreground': 'hsl(0 0% 98%)',
        destructive: 'hsl(0 84% 60%)',
        'destructive-foreground': 'hsl(0 0% 98%)',
        border: 'hsl(240 5% 15%)',
        input: 'hsl(240 5% 15%)',
        ring: 'hsl(72 100% 50%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};