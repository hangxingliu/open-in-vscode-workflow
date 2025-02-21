import { join } from 'node:path';
import { readDir } from '../../utils.js';

export async function scanSingleDirectory(
  fullPath: string,
  opts: {
    projectFiles: ReadonlyArray<string | RegExp>;
    pruningNames: ReadonlyArray<string | RegExp>;
  }
) {
  let isProject = false;
  const nextScan: string[] = [];
  const files = await readDir(fullPath);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!isProject && testFileName(file.name, opts.projectFiles)) {
      isProject = true;
      continue;
    }

    if (file.isDirectory()) {
      const pruned = testFileName(file.name, opts.pruningNames);
      if (pruned) continue;
      nextScan.push(join(fullPath, file.name));
    }
  }
  return { isProject, nextScan };
}

function testFileName(fileName: string, rules: ReadonlyArray<string | RegExp>) {
  for (const rule of rules) {
    if (typeof rule === 'string') {
      if (fileName === rule) return true;
    } else {
      if (rule.test(fileName)) return true;
    }
  }
  return false;
}
