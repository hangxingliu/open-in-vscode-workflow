import { basename, dirname, join, relative } from 'node:path';
import { CacheManager } from '../../alfred/cache-manager.js';
import { AlfredConfig, ScanDirectoryConfig } from '../../alfred/config.js';
import { isDir, shortenPath, URLSet } from '../../utils.js';
import { ScannerResult, ScannerState } from './types.js';
import { scanSingleDirectory } from './utils.js';

export class ProjectDirectoryScanner {
  scanned = new Set<string>();
  result: ScannerResult[] = [];
  constructor(private readonly urlSet: URLSet, private readonly opts: ScanDirectoryConfig) {}

  async scan(cacheManager?: CacheManager<ScannerResult>) {
    const { cacheEnabled } = this.opts;
    const { isDebugMode } = AlfredConfig.get();

    if (cacheEnabled) {
      const cache = await cacheManager?.loadCache();
      if (cache) {
        this.result = cache;
        cache.forEach((it) => this.urlSet.addFsPath(it.fsPath));
        return this.result;
      }
    }

    const baseDirs = [...this.opts.baseDirs].sort((a, b) => b.length - a.length);
    if (isDebugMode) console.error(`scanning projects from: ${JSON.stringify(baseDirs)}`);

    for (let i = 0; i < baseDirs.length; i++) {
      const baseDir = baseDirs[i];
      if (await isDir(baseDir)) {
        await this._scan(baseDir, baseDir, {
          depth: 0,
          parentIsProject: false,
        }).catch(console.error);
      }
    }

    let attached = 0;
    for (let i = 0; i < this.opts.extraDirs.length; i++) {
      const attachDir = this.opts.extraDirs[i];
      if (await isDir(attachDir)) {
        const baseName = basename(attachDir);
        this.result.push({
          fsPath: attachDir,
          baseName,
          shortName: baseName,
          aliasPath: shortenPath(attachDir),
        });
        attached++;
        this.urlSet.addFsPath(attachDir);
      }
    }

    if (cacheManager && cacheEnabled) cacheManager.saveCache(this.result);
    if (isDebugMode)
      console.error(
        `scanned ${this.result.length} project(s), including ${attached} attached projects`
      );
    return this.result;
  }

  private async _scan(baseDir: string, fullPath: string, state: ScannerState) {
    const { maxDepth } = this.opts;
    if (state.depth >= maxDepth) return;
    if (this.scanned.has(fullPath)) return;
    this.scanned.add(fullPath);

    const { isProject, nextScan } = await scanSingleDirectory(fullPath, this.opts);
    if (isProject && !this.urlSet.hasFsPath(fullPath)) {
      const baseName = basename(fullPath);
      let shortName = baseName;
      if (state.parentIsProject) shortName = basename(dirname(fullPath)) + '/' + baseName;
      this.result.push({
        fsPath: fullPath,
        baseName,
        shortName,
        aliasPath: basename(baseDir) + '/' + relative(baseDir, fullPath),
      });
      this.urlSet.addFsPath(fullPath);
    }

    for (let i = 0; i < nextScan.length; i++) {
      const filePath = nextScan[i];
      await this._scan(baseDir, filePath, {
        depth: state.depth + 1,
        parentIsProject: isProject,
      });
    }
  }
}
