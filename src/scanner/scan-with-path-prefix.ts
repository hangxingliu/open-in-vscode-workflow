import { Dirent } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { readDir } from '../utils.js';
import { IGNORED_MACOS_FILES } from './ignored-files.js';

export type ScanResult = { isDir: boolean; basename: string; fullPath: string };

export class WithPathPrefixScanner {
  static async read(pathPrefix: string): Promise<ScanResult[]> {
    let baseDir = pathPrefix;
    let items: Dirent[] = [];
    if (pathPrefix.endsWith('/')) {
      items = await readDir(baseDir);
    } else {
      baseDir = dirname(pathPrefix);
      const filterLC = basename(pathPrefix).toLowerCase();
      items = await readDir(baseDir);
      items = items.filter((it) => it.name.toLowerCase().indexOf(filterLC) >= 0);
    }

    const resultA: ScanResult[] = [];
    const resultB: ScanResult[] = [];
    const resultC: ScanResult[] = [];
    const resultD: ScanResult[] = [];
    items.forEach((it) => {
      if (it.name.startsWith('._')) return;
      if (IGNORED_MACOS_FILES.has(it.name)) return;

      const r = {
        isDir: it.isDirectory(),
        basename: it.name,
        fullPath: resolve(baseDir, it.name),
      };
      if (r.basename[0] !== '.') (r.isDir ? resultA : resultB).push(r);
      else (r.isDir ? resultC : resultD).push(r);
    });

    const comparator = (a: ScanResult, b: ScanResult) => {
      if (a.basename === b.basename) return 0;
      if (/^\d/.test(a.basename) && /^\d/.test(b.basename))
        return parseInt(a.basename, 10) - parseInt(b.basename, 10);
      return a.basename > b.basename ? 1 : -1;
    };
    return resultA
      .sort(comparator)
      .concat(resultB.sort(comparator), resultC.sort(comparator), resultD.sort(comparator));
  }
}
