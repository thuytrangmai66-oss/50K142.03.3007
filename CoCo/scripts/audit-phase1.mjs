import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true })
  .flatMap(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
const legacy = /supabase|motocare|moto-care|rental_requests|vehicles|gemini|emailjs|vietqr\.io|tesseract/i;
const runtime = [...walk('src'), ...walk('.github'), 'package.json', 'package-lock.json', 'vite.config.ts', 'index.html'];
const results = [
  { id: 'P1-01', pass: runtime.every(file => !legacy.test(read(file))), detail: 'No legacy domain or external integrations in source, dependencies, config or workflow' },
  { id: 'P1-02', pass: !walk('src').some(file => /seed|adapter|repo\/|engine\//i.test(file)), detail: 'No legacy seed, repository, adapter or engine' },
  { id: 'P1-03', pass: !fs.existsSync(path.join(root, 'supabase')) && !fs.existsSync(path.join(root, 'public/sw.js')), detail: 'Removed cloud SQL and old service worker' },
  { id: 'P1-04', pass: /'CoCoDB'/.test(read('src/db/schema.ts')) && !/localStorage|sessionStorage/.test(walk('src').map(read).join('\n')), detail: 'Dedicated CoCoDB, no inherited local/session storage' },
  { id: 'P1-05', pass: !/https?:\/\//.test(walk('src').map(read).join('\n')), detail: 'No external HTTP endpoint in application source' },
];
fs.mkdirSync(path.join(root, 'planning/phase1'), { recursive: true });
fs.writeFileSync(path.join(root, 'planning/phase1/AUDIT_RESULTS.json'), JSON.stringify({ scope: 'Static Phase 1 checks; browser tests recorded separately', results }, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
assert(results.every(result => result.pass), 'Phase 1 static audit failed');
