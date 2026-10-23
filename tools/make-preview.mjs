// Build a single-file preview: /workspace/work/homepage/preview/index.html
import { build } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
const SITE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = process.env.PREVIEW_OUT || path.resolve(SITE, '../preview');
fs.mkdirSync(OUT, { recursive: true });
const res = await build({
  root: SITE, configFile: false, logLevel: 'warn',
  build: {
    write: false, minify: true, target: 'es2019',
    lib: { entry: path.join(SITE, 'src/scripts/main.js'), formats: ['iife'], name: 'ZZH', fileName: () => 'main.js' },
    rolldownOptions: { output: { codeSplitting: false } },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const outs = (Array.isArray(res) ? res : [res]).flatMap((r) => r.output);
const chunks = outs.filter((o) => o.type === 'chunk');
if (chunks.length !== 1) console.log('WARN chunks:', chunks.map((c) => c.fileName));
let code = chunks.map((c) => c.code).join('\n').replace(/<\/script/gi, '<\\/script');
let html = fs.readFileSync(path.join(SITE, 'dist/index.html'), 'utf8');
const cssFiles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g)].map((m) => m[1]);
let css = cssFiles.map((f) => fs.readFileSync(path.join(SITE, 'dist', f), 'utf8')).join('\n');
css = css.replace(/url\((['"]?)\/fonts\/([A-Za-z_-]+)\.(woff2|ttf)\1\)/g, (_, q, n, ext) =>
  `url(data:font/${ext};base64,${fs.readFileSync(path.join(SITE, 'dist/fonts', n + '.' + ext)).toString('base64')})`);
// raster art: inline /img/*.avif|webp as data URIs (AVIF + WebP both kept so srcset still works)
const uri = (f) => `data:image/${f.split('.').pop()};base64,` + fs.readFileSync(path.join(SITE, 'dist', f)).toString('base64');
const imgCache = {};
const inl = (f) => (imgCache[f] ??= uri(f));
const fav = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(SITE, 'dist/favicon.svg')).toString('base64');
// v3.1: CSS backgrounds that point at /img (film strip) are inlined too
css = css.replace(/url\((['"]?)\/img\/([A-Za-z0-9@._\/-]+\.(?:avif|webp))\1\)/g, (_, q, f) => `url(${inl('img/' + f)})`);
html = html
  .replace(/<link rel="stylesheet"[^>]*>/g, '')
  .replace(/<link rel="preload"[^>]*>/g, '')
  .replace(/\/img\/[A-Za-z0-9@._\/-]+\.(avif|webp)/g, (m) => inl(m.slice(1)))
  .replace(/<script type="module"[^>]*><\/script>/g, '')
  .replace(/href="\/favicon\.svg"/, `href="${fav}"`)
  .replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*"\s*\/?>/,
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">`)
  .replace('</head>', `<style>${css}</style></head>`)
  .replace('</body>', `<script>${code}</script></body>`);
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('preview bytes', html.length, 'js', code.length, 'css', css.length);
