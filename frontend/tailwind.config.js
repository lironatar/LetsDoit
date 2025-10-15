/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Noto Sans Hebrew', 'system-ui', 'sans-serif'],
      },
      colors: {
        todoist: {
          red: '#e44332',
          'red-dark': '#FF7066', // Dark mode red color
          orange: '#ff9500',
          yellow: '#fad000',
          green: '#7ecc49',
          blue: '#4073ff',
          purple: '#884dff',
          pink: '#ff4dff',
          gray: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#e5e5e5',
            300: '#d4d4d4',
            400: '#a3a3a3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
          }
        }
      }
    },
  },
  plugins: [],
}
