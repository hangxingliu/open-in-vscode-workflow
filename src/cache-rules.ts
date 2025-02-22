import { CacheRule } from './alfred/cache-manager.js';
import { AlfredFilter } from './alfred/types.js';
import { ScannerResult } from './scanner/project-directory/types.js';
import { ParsedWorkspaceFolderUri } from './scanner/vscode-workspace/types.js';

export const scanProjectCache: CacheRule<ScannerResult> = {
  name: 'dir',
  version: 1,
  maxAge: 10 * 1000,
};

export const scanWorkspaceCache: CacheRule<ParsedWorkspaceFolderUri> = {
  name: 'ws',
  version: 1,
  maxAge: 15 * 1000,
  fromCache: (cache) => {
    return Object.assign(cache, { url: new URL(cache.url as string) }) as any;
  },
  toCache: (it) => {
    return Object.assign({}, it, { url: it.url.toString() }) as any;
  },
};

export const resultCache: CacheRule<AlfredFilter.Item> = {
  name: 'result',
  version: 1,
  maxAge: 60 * 1000,
};
