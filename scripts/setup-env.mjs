// Creates .env.local on first run, with a freshly generated AUTH_SECRET.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, '.env.local');
const example = readFileSync(join(root, '.env.example'), 'utf8');
const secret = randomBytes(48).toString('base64url');

if (!existsSync(target)) {
  writeFileSync(target, example.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${secret}`));
  console.log('Created .env.local with a new AUTH_SECRET.');
} else {
  const current = readFileSync(target, 'utf8');
  const m = /^AUTH_SECRET=(.*)$/m.exec(current);
  if (!m || m[1].trim().length < 32) {
    const next = m ? current.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${secret}`) : `${current.trimEnd()}\nAUTH_SECRET=${secret}\n`;
    writeFileSync(target, next);
    console.log('Filled in a missing or too-short AUTH_SECRET in .env.local.');
  } else {
    console.log('.env.local already configured.');
  }
}
console.log('MongoDB URI is read from MONGODB_URI in .env.local (default: mongodb://127.0.0.1:27017/folio).');
