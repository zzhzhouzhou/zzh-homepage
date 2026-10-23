import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://zzh.loc.cc',
  output: 'static',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never', assets: '_astro' },
  vite: {
    build: { assetsInlineLimit: 0, cssCodeSplit: false },
  },
});
