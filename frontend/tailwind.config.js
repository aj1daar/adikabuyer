export default {
  theme: {
    extend: {
      colors: {
        bubblegum: {
          DEFAULT: '#E8799F',
          light: '#F3A9C0',
          dark: '#D45C86',
        },
        ink: '#0A0A0A',
        silver: {
          DEFAULT: '#F1F1F3',
          dark: '#D9D9DE',
        },
      },
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(3.5rem, 9vw, 8rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        pill: '999px',
      },
    },
  },
}
