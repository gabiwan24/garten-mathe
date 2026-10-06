import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// logo.svg is full-bleed with everything inside the maskable safe zone, so the maskable
// and apple icons need no padding; the sky background only guards against any white ring.
const sky = { background: '#E4EFEA' };

export default defineConfig({
  preset: {
    ...preset,
    maskable: { ...preset.maskable, padding: 0, resizeOptions: sky },
    apple: { ...preset.apple, padding: 0, resizeOptions: sky },
  },
  images: ['public/logo.svg'],
});
