import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F4F9F7',
          100: '#E4F2EE',
          200: '#C2E3DB',
          500: '#166555',
          600: '#116654', // Swatch 1 Primary Emerald/Pine
          700: '#0E5445',
          800: '#0C4538',
          900: '#0B201A', // Swatch 2 Deep Dark Forest
          950: '#071612',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#116654',
          600: '#0E5445',
          700: '#0C4538',
          800: '#0B201A',
          900: '#071612',
        },
      },
    },
  },
  plugins: [],
};
export default config;
