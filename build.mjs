// Builds the single-file artifact page from src/.
//   node build.mjs          -> dist/windowsill-cactus.html (+ preview.html for local testing)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const ORDER = [
  'util', 'data', 'sun', 'weather', 'sim', 'store',
  'room', 'fx', 'plant', 'items', 'ui', 'audio', 'main',
];

const listed = new Set(ORDER.map((n) => `${n}.js`));
for (const f of readdirSync('src/js')) {
  if (!listed.has(f)) throw new Error(`src/js/${f} is not in the build ORDER`);
}

const css = readFileSync('src/style.css', 'utf8');
const js = ORDER.map((n) => `// ---- ${n}.js ----\n${readFileSync(`src/js/${n}.js`, 'utf8')}`).join('\n');
const template = readFileSync('src/index.html', 'utf8');

const page = template
  .replace('/*__CSS__*/', () => css)
  .replace('/*__JS__*/', () => `(() => {\n'use strict';\n${js}\n})();`);

writeFileSync('dist/windowsill-cactus.html', page);

// Local preview: mimic the artifact skeleton (doctype, viewport, small reset).
const preview = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#fafaf7}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${page}</body></html>`;
writeFileSync('preview.html', preview);

console.log(`built dist/windowsill-cactus.html (${(page.length / 1024).toFixed(1)} KB)`);
