import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const output = join(root, 'dist');
const excluded = new Set(['.git', 'dist', 'node_modules', 'scripts', 'self-mirror', 'workers', 'package.json', 'package-lock.json']);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  await cp(join(root, entry.name), join(output, entry.name), { recursive: true });
}

await cp(join(root, 'self-mirror', 'dist'), join(output, 'self-mirror'), { recursive: true });
