// Shared: a tiny static server for the repo and a Playwright Chromium (phone-sized).
const http = require('http'), fs = require('fs'), path = require('path');
const { ROOT } = require('./load');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, () => res({ url: `http://localhost:${srv.address().port}/`, close: () => srv.close() }));
  });
}
function playwright() {
  const tries = [process.env.PLAYWRIGHT_PATH, 'playwright', '/home/claude/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright'].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) { } }
  throw new Error('Playwright not found: npm i -D playwright, or set PLAYWRIGHT_PATH');
}
async function phone(opts = {}) {
  const { chromium } = playwright();
  const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, deviceScaleFactor: opts.scale || 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  return { browser, page, errors };
}
module.exports = { serve, phone };
