import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        twinkle: {
          sky: '#BDE0FE',
          blue: '#BDE0FE',
          skyDeep: '#93C5FD',
          pink: '#FFC8DD',
          pinkDeep: '#F9A8D4',
          lavender: '#CDB4DB',
          yellow: '#FFF1A8',
          cream: '#FFF9F2',
          ink: '#3F3A5A',
          muted: '#7A7496'
        }
      },
      fontFamily: {
        sans: ['var(--font-quicksand)', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        cloud: '0 12px 32px rgba(98, 92, 145, 0.14)',
        glow: '0 0 24px rgba(255, 241, 168, 0.75)'
      },
      borderRadius: {
        cloud: '2rem'
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      animation: {
        twinkle: 'twinkle 2.6s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
