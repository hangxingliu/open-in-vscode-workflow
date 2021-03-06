import * as os from 'os';
import * as path from 'path';
import { mkdirSync, existsSync } from 'fs';
import { stat, readText, writeText, readBoolFromEnvironment } from './utils';
import { AlfredItem, ScannerResult, SerializedItem, WorkspaceStorageResult } from './types';

type CacheDescpritor<T> = {
  name: string;
  maxAge: number;
  version: number;
  toCache: (item: T) => SerializedItem<T>;
  fromCache: (item: SerializedItem<T>) => T;
};

let tmpdir = os.tmpdir();
const cachePrefix = 'openinvscode-cachev';
const cacheEnabled = readBoolFromEnvironment('cache_enabled', true);

// use alfred cache dir
if (process.env.alfred_workflow_cache) {
  const tmpdirAlfred = process.env.alfred_workflow_cache;
  if (path.isAbsolute(tmpdirAlfred)) {
    if (existsSync(tmpdirAlfred)) {
      tmpdir = tmpdirAlfred;
    } else {
      try {
        mkdirSync(tmpdirAlfred);
        tmpdir = tmpdirAlfred;
      } catch (error) {
        // noop
      }
    }
  }
}

export class CacheManager<T> {
  constructor(readonly descriptor: CacheDescpritor<T>) {}

  private getFile = () =>
    path.resolve(tmpdir, `${cachePrefix}${this.descriptor.version}-${this.descriptor.name}.json`);

  loadCache = async (condition = ''): Promise<T[]> => {
    if (!cacheEnabled) return;
    if (!tmpdir) return;

    const file = this.getFile();
    const st = await stat(file);
    if (!st) return;

    if (st.mtimeMs > Date.now() - this.descriptor.maxAge) {
      console.error(`info: matched cache file: '${file}'`);
      try {
        const data = JSON.parse(await readText(file));
        if (!data || !data.cache) return;
        if (data.condition !== condition) return;

        const { cache } = data;
        if (!Array.isArray(cache)) return;
        return cache.map((it) => this.descriptor.fromCache(it));
      } catch (error) {
        console.error(error);
      }
    }
  };

  saveCache = async (items: T[], condition = '') => {
    if (!cacheEnabled) return;
    if (!tmpdir) return;
    const file = this.getFile();
    try {
      const cache = items.map((it) => this.descriptor.toCache(it));
      await writeText(file, JSON.stringify({ condition, cache }));
      console.error(`info: saved cache file: '${file}'`);
    } catch (error) {
      console.error(error);
    }
  };
}

const copy = <T>(it: T) => it as any;

export const scanDirCache = new CacheManager<ScannerResult>({
  name: 'dir',
  version: 1,
  maxAge: 10 * 1000,
  fromCache: copy,
  toCache: copy,
});
export const wsStorageCache = new CacheManager<WorkspaceStorageResult>({
  name: 'ws',
  version: 1,
  maxAge: 15 * 1000,
  fromCache: (cache) => {
    return Object.assign(cache, { uri: new URL(cache.uri as any) }) as any;
  },
  toCache: (it) => {
    return Object.assign({}, it, { uri: it.uri.toString() });
  },
});

export const resultCache = new CacheManager<AlfredItem>({
  name: 'result',
  version: 1,
  maxAge: 60 * 1000,
  fromCache: copy,
  toCache: copy,
});
