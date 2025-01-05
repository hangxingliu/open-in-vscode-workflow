import { JsonValue } from 'type-fest';
import { tmpdir as getTmpDir } from 'node:os';
import { isAbsolute, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';

export type CacheRule<T> = {
  name: string;
  maxAge: number;
  version: number;

  toCache?: (item: T) => Record<keyof T, JsonValue>;
  fromCache?: (item: Record<keyof T, JsonValue>) => T;
};

function getCacheDir() {
  const systemCacheDir = getTmpDir();
  const alfredCacheDir = process.env.alfred_workflow_cache;

  if (!alfredCacheDir) return systemCacheDir;
  if (!isAbsolute(alfredCacheDir)) return systemCacheDir;
  if (!existsSync(alfredCacheDir)) {
    try {
      mkdirSync(alfredCacheDir);
    } catch {
      // noop
      return systemCacheDir;
    }
  }
  return alfredCacheDir;
}

export class CacheManager<T> {
  static CACHE_DIR = getCacheDir();
  static DEFAULT_FROM_CACHE: <T>(it: T) => any = (it) => it;
  static DEFAULT_TO_CACHE: <T>(it: T) => any = (it) => it;

  constructor(readonly rule: CacheRule<T>, readonly enabled: boolean) {}

  private getFile() {
    return resolve(CacheManager.CACHE_DIR, `${this.rule.name}-${this.rule.version}.json`);
  }

  async loadCache(condition = ''): Promise<T[] | undefined> {
    if (!this.enabled) return;
    const file = this.getFile();

    const st = await stat(file);
    if (!st) return;

    if (st.mtimeMs > Date.now() - this.rule.maxAge) {
      console.error(`info: matched cache file: '${file}'`);
      try {
        const data = JSON.parse(await readFile(file, 'utf-8'));
        if (!data || !data.cache) return;
        if (data.condition !== condition) return;

        const { cache } = data;
        if (!Array.isArray(cache)) return;

        const fromCache = this.rule.fromCache || CacheManager.DEFAULT_FROM_CACHE;
        return cache.map(fromCache);
      } catch (error) {
        console.error(error);
      }
    }
  }

  saveCache = async (items: T[], condition = '') => {
    if (!this.enabled) return;

    const file = this.getFile();
    try {
      const toCache = this.rule.toCache || CacheManager.DEFAULT_TO_CACHE;
      const cache = items.map(toCache);
      await writeFile(file, JSON.stringify({ condition, cache }));
      console.error(`info: saved cache file: '${file}'`);
    } catch (error) {
      console.error(error);
    }
  };
}
