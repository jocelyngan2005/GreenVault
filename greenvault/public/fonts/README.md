# Local Font Setup for Geist

If Google Fonts continues to have connection issues, you can download Geist fonts locally:

## Download Geist Fonts

1. Go to https://vercel.com/font
2. Download Geist and Geist Mono font files
3. Place them in the `/public/fonts/` directory

## Update layout.tsx to use local fonts

Replace the Google Fonts import with local font loading:

```tsx
import localFont from 'next/font/local'

const geistSans = localFont({
  src: [
    {
      path: '../public/fonts/GeistVF.woff2',
      weight: '100 900',
    },
  ],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = localFont({
  src: [
    {
      path: '../public/fonts/GeistMonoVF.woff2',
      weight: '100 900',
    },
  ],
  variable: '--font-geist-mono',
  display: 'swap',
})
```

## Current Setup

The current setup includes:
- Fallback fonts for better reliability
- `display: "swap"` for better loading performance
- Comprehensive monospace font stack for Geist Mono fallback

The app should work with system fonts even if Geist fonts fail to load.
