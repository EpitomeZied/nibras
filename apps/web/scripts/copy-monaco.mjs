import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, '../../node_modules/monaco-editor/min/vs');
const target = join(root, 'public/monaco/vs');

if (!existsSync(source)) {
  console.error('[copy-monaco] monaco-editor assets not found at', source);
  process.exit(1);
}

rmSync(join(root, 'public/monaco'), { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log('[copy-monaco] copied monaco assets to public/monaco/vs');
