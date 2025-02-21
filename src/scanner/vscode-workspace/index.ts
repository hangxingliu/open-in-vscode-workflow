import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { readDir, stat, URLSet } from '../../utils.js';
import { CacheManager } from '../../alfred/cache-manager.js';
import type { VSCodeVariety } from '../../vscode-varieties.js';
import { readFile } from 'node:fs/promises';
import { parseWorkspaceFolderUri } from './utils.js';
import { ParsedWorkspaceFolderUri } from './types.js';

export class VSCodeWorkspaceScanner {
  static MAX_WORKSPACE_JSONS_SIZE = 512 * 1024;
  private readonly baseDir: string;

  /** remoteNameLC => remoteName */
  readonly remoteNamesMap = new Map<string, string>();

  readonly result: ParsedWorkspaceFolderUri[] = [];
  private setResult(result: ParsedWorkspaceFolderUri[]) {
    for (const it of result) {
      if (it.remoteName) this.remoteNamesMap.set(it.remoteName.toLowerCase(), it.remoteName);
      if (this.urlSet.hasURL(it.url)) continue;

      this.urlSet.add(it.url.toString());
      this.result.push(it);
    }
    return this.result;
  }

  /**
   * @param urlSet A URL set to ensure no duplicate workspace URL
   * @param appConfigDirName {@link VSCodeVariety.configDir}
   */
  constructor(private readonly urlSet: URLSet, appConfigDirName: string) {
    this.baseDir = resolve(
      homedir(),
      `Library/Application Support`,
      appConfigDirName,
      `User/workspaceStorage`
    );
  }

  async scan(cacheManager?: CacheManager<ParsedWorkspaceFolderUri>) {
    const cache = await cacheManager?.loadCache();
    if (cache) return this.setResult(cache);

    const workspaces = await readDir(this.baseDir);
    const promises = workspaces.map(async (dir) => {
      if (!dir.isDirectory()) return;

      const jsonFile = resolve(this.baseDir, dir.name, 'workspace.json');
      const st = await stat(jsonFile);
      if (!st || !st.isFile()) return;
      if (st.size > VSCodeWorkspaceScanner.MAX_WORKSPACE_JSONS_SIZE) return;

      try {
        const json = await readFile(jsonFile, 'utf-8');
        const storage = JSON.parse(json);
        const rawURL = storage?.folder as string;
        if (!rawURL || typeof rawURL !== 'string') return;

        const url = new URL(rawURL);
        if (this.urlSet.hasURL(url)) return;
        return parseWorkspaceFolderUri(url);
      } catch {
        // noop
      }
    });

    const result = (await Promise.all(promises)).filter(Boolean) as ParsedWorkspaceFolderUri[];
    if (cacheManager) cacheManager.saveCache(result);
    return this.setResult(result);
  }
}
