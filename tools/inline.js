// Builds one self-contained page (for a quick preview link): css and js inlined, no doctype/html/head/body.
const fs = require('fs'), path = require('path'); const R = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
let h = R('index.html');
h = h.replace(/<link rel="stylesheet" href="css\/style.css[^"]*">/, () => `<style>${R('css/style.css')}</style>`);
h = h.replace(/<script src="(js\/[a-z]+\.js)[^"]*"><\/script>/g, (m, f) => `<script>${R(f)}</script>`);
h = h.replace(/<!doctype html>\s*<html[^>]*>\s*<head>\s*/i, '').replace(/<\/head>\s*<body>/i, '').replace(/<\/body>\s*<\/html>\s*$/i, '').replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/, '');
h = h.replace('<title>Ravnsted</title>', '<title>Ravnsted</title>\n<meta name="claude:viewport-fit-sides" content="cover">');
fs.writeFileSync(process.argv[2], h); console.log('wrote', process.argv[2], (h.length / 1024 | 0) + ' KB');
