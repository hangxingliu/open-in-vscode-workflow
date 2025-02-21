import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseEnv } from 'node:util';

const ENV_FILE_NAME = 'dev.env';

export function loadDevEnv() {
  let baseDir = resolve(__dirname, '../..');
  let envFile = join(baseDir, ENV_FILE_NAME);

  let maxDepth = 2;
  while (!existsSync(envFile)) {
    if (--maxDepth > 0) {
      baseDir = resolve(baseDir, '..');
      envFile = join(baseDir, ENV_FILE_NAME);
      continue;
    }
    throw new Error(`Failed to find ${ENV_FILE_NAME} in the project directory`);
  }
  const envLines = readFileSync(envFile, 'utf-8')
    .split(/\r?\n/)
    .filter((it) => it && !it.match(/^\s*[;#]/));

  const env = parseEnv(envLines.join('\n'));
  console.error(
    `Loaded ${Object.keys(env).length} env var(s) from ${relative(process.cwd(), envFile)}`
  );
  Object.assign(process.env, env);
}
