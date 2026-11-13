import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true })
  .flatMap(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
const legacy = /supabase|motocare|moto-care|rental_requests|vehicles|gemini|emailjs|vietqr\.io|tesseract/i;
const source = walk('src').filter(file => /\.(ts|tsx|css)$/.test(file));
const runtime = [...source, '../.github/workflows/deploy.yml', 'package.json', 'package-lock.json', 'vite.config.ts', 'index.html'];
// Match path segments: "PurchaseEditor" contains "seed" across the word
// boundary but is neither a legacy seed module nor an adapter.
const legacyModule = /(?:^|\/)(?:seed[^/]*|adapter[^/]*|repo|engine)(?:\/|$)/i;
const results = [
  { id: 'P1-01', pass: runtime.every(file => !legacy.test(read(file))), detail: 'No legacy domain or external integrations in source, dependencies, config or workflow' },
  { id: 'P1-02', pass: !walk('src').some(file => legacyModule.test(file)), detail: 'No legacy seed, repository, adapter or engine' },
  { id: 'P1-03', pass: !fs.existsSync(path.join(root, 'supabase')) && !fs.existsSync(path.join(root, 'public/sw.js')), detail: 'Removed cloud SQL and old service worker' },
  { id: 'P1-04', pass: /'CoCoDB'/.test(read('src/db/schema.ts')) && !/\blocalStorage\s*\./.test(source.map(read).join('\n')) &&
    source.filter(file => /\bsessionStorage\s*\./.test(read(file))).every(file => file === 'src/services/auth/storage.ts') &&
    /COCO_SESSION_STORAGE_KEY = 'coco:session'/.test(read('src/services/auth/storage.ts')),
    detail: 'Dedicated CoCoDB; session storage isolated to coco:session token module; no inherited storage' },
  { id: 'P1-05', pass: !/https?:\/\//.test(source.map(read).join('\n')), detail: 'No external HTTP endpoint in application source' },
];
// Keep the existing CI default; G6 work records its own evidence explicitly.
const phase = process.argv.includes('--phase=6') ? 6 : 5;
fs.mkdirSync(path.join(root, `planning/phase${phase}`), { recursive: true });
fs.writeFileSync(path.join(root, `planning/phase${phase}/AUDIT_RESULTS.json`), JSON.stringify({ scope: `Static runtime checks during Phase ${phase}; local only; browser tests recorded separately`, results }, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
assert(results.every(result => result.pass), 'Phase 1 static audit failed');
