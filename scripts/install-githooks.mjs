import { chmodSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const hooksDir = join(rootDir, '.git', 'hooks');
const sourceHook = join(rootDir, 'githooks', 'pre-commit');
const targetHook = join(hooksDir, 'pre-commit');

if (!existsSync(sourceHook)) {
  process.exit(0);
}

if (!existsSync(hooksDir)) {
  mkdirSync(hooksDir, { recursive: true });
}

copyFileSync(sourceHook, targetHook);
chmodSync(targetHook, 0o755);