/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#0b0d14',
        dusk: '#151927',
        haze: '#8f96ad',
        sun: '#ffc66b',
        coral: '#ff7a59',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bar: { '0%,100%': { transform: 'scaleY(0.3)' }, '50%': { transform: 'scaleY(1)' } },
      },
      animation: {
        'fade-in': 'fadeIn 1.2s ease both',
        rise: 'rise 0.6s ease both',
        bar: 'bar 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
