// Local QA tool only. PDF.js is supplied from a verified TEMP extraction, never
// installed into the application. Neither PDFs nor rasterizations leave localhost.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.dirname(app), codex = path.join(workspace, 'CODEX');
const cache = path.join(app, 'planning/phase10/evidence/reference-cache');
const args = process.argv.slice(2), value = flag => args[args.indexOf(flag) + 1];
if (!args.includes('--pdfjs-root') || !value('--pdfjs-root')) throw new Error('--pdfjs-root is required');
const pdfjs = path.resolve(value('--pdfjs-root'));
const version = JSON.parse(await fs.readFile(path.join(pdfjs, 'package.json'), 'utf8')).version;
const inside = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
};
let inputs;
if (args.includes('--all')) {
  const inventory = JSON.parse(await fs.readFile(path.join(app, 'planning/phase10/evidence/audit/source-inventory.json'), 'utf8'));
  inputs = inventory.screens.filter(row => row.cleanExport?.format === 'PDF')
    .map(row => ({ id: row.id, source: path.resolve(workspace, row.cleanExport.path) }));
} else {
  if (!args.includes('--source') || !args.includes('--id') || !/^SC\d{3}$/.test(value('--id'))) throw new Error('--source and --id SCnnn are required');
  inputs = [{ id: value('--id'), source: path.resolve(value('--source')) }];
}
for (const item of inputs) {
  if (!inside(codex, await fs.realpath(item.source)) || path.extname(item.source).toLowerCase() !== '.pdf') throw new Error('Only CODEX PDF references are allowed');
}
await fs.mkdir(cache, { recursive: true });
const allowed = new Map([['/pdf.mjs', 'pdf.mjs'], ['/pdf.worker.mjs', 'pdf.worker.mjs']]);
const server = http.createServer(async (request, response) => {
  try {
    if (request.url === '/') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><canvas></canvas>'); return; }
    const file = allowed.get(request.url);
    if (!file) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    response.end(await fs.readFile(path.join(pdfjs, 'build', file)));
  } catch { response.writeHead(500); response.end(); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
let browser;
const results = [];
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(origin);
  await page.evaluate(async () => {
    globalThis.pdfjs = await import('/pdf.mjs');
    globalThis.pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
  });
  for (const item of inputs) {
    const bytes = await fs.readFile(item.source);
    const rendered = await page.evaluate(async base64 => {
      const task = globalThis.pdfjs.getDocument({ data: Uint8Array.from(atob(base64), c => c.charCodeAt(0)), useSystemFonts: false });
      const doc = await task.promise;
      const pdfPage = await doc.getPage(1), viewport = pdfPage.getViewport({ scale: 1 });
      const canvas = document.querySelector('canvas');
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const result = { width: canvas.width, height: canvas.height, pages: doc.numPages, png: canvas.toDataURL('image/png') };
      await task.destroy(); return result;
    }, bytes.toString('base64'));
    const png = Buffer.from(rendered.png.split(',')[1], 'base64');
    await fs.writeFile(path.join(cache, `${item.id}.png`), png);
    results.push({ id: item.id, source: path.relative(workspace, item.source), sourceSha256: createHash('sha256').update(bytes).digest('hex'),
      renderer: `pdfjs-dist ${version} / Chromium ${browser.version()}`, dpr: 1, scale: 1,
      width: rendered.width, height: rendered.height, pages: rendered.pages,
      rasterSha256: createHash('sha256').update(png).digest('hex'), visualStatus: 'NOT_RUN', review: 'Rasterization is not a visual comparison or accepted baseline' });
  }
  await fs.writeFile(path.join(cache, 'index.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({ rendered: results.length, cache: path.relative(app, cache), visualComparisonsPassed: 0 }));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
