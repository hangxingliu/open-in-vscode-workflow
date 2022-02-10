import * as path from 'path';
import { scanDirCache, wsStorageCache } from './cache';
import {
  ScannerOptions,
  ScannerResult,
  ScannerState,
  WorkspaceRemoteType,
  WorkspaceStorageResult,
} from './types';
import { Dirent } from 'fs';
import { readText, stat, isDir, readDir, resolvePath, exists, URLSet, shortenPath } from './utils';

export const workspaceStorageDirs = {
  code: '~/Library/Application Support/Code/User/workspaceStorage',
};
const maxWorkspaceJsonFileSize = 512 * 1024;

export class Scanner {
  scanned = new Set<string>();
  result: ScannerResult[] = [];
  constructor(private readonly urlSet: URLSet, private readonly opts: ScannerOptions) {}

  async scan() {
    const cache = await scanDirCache.loadCache();
    if (cache) {
      this.result = cache;
      cache.forEach((it) => this.urlSet.addFsPath(it.fsPath));
      return;
    }

    const baseDirs = this.opts.baseDirs.sort((a, b) => b.length - a.length);
    for (let i = 0; i < baseDirs.length; i++) {
      const baseDir = baseDirs[i];
      if (await isDir(baseDir)) {
        await this._scan(baseDir, baseDir, {
          depth: 0,
          parentIsProject: false,
        }).catch(console.error);
      }
    }

    for (let i = 0; i < this.opts.attachDirs.length; i++) {
      const attachDir = this.opts.attachDirs[i];
      if (await isDir(attachDir)) {
        const baseName = path.basename(attachDir);
        this.result.push({
          fsPath: attachDir,
          baseName,
          shortName: baseName,
          aliasPath: shortenPath(attachDir),
        });
        this.urlSet.addFsPath(attachDir);
      }
    }

    scanDirCache.saveCache(this.result);
  }

  private async _scan(baseDir: string, fullPath: string, state: ScannerState) {
    const { maxDepth, projectFilesRegex, pruningNameRegex } = this.opts;
    if (state.depth >= maxDepth) return;
    if (this.scanned.has(fullPath)) return;
    this.scanned.add(fullPath);

    let isProject = false;
    const nextScan: string[] = [];

    const files = await readDir(fullPath);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!isProject && projectFilesRegex.findIndex((re) => re.test(file.name)) >= 0) {
        isProject = true;
        continue;
      }

      if (file.isDirectory()) {
        const pruned = pruningNameRegex.findIndex((re) => re.test(file.name)) >= 0;
        if (pruned) continue;
        nextScan.push(path.join(fullPath, file.name));
      }
    }

    if (isProject && !this.urlSet.hasFsPath(fullPath)) {
      const baseName = path.basename(fullPath);
      let shortName = baseName;
      if (state.parentIsProject) shortName = path.basename(path.dirname(fullPath)) + '/' + baseName;
      this.result.push({
        fsPath: fullPath,
        baseName,
        shortName,
        aliasPath: path.basename(baseDir) + '/' + path.relative(baseDir, fullPath),
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

export type AbsPathScanResult = { isDir: boolean; basename: string; fullPath: string };
export class AbsPathScanner {
  static async read(pathPrefix: string): Promise<AbsPathScanResult[]> {
    let baseDir = pathPrefix;
    let items: Dirent[] = [];
    if (pathPrefix.endsWith('/')) {
      items = await readDir(baseDir);
    } else {
      baseDir = path.dirname(pathPrefix);
      const filterLC = path.basename(pathPrefix).toLowerCase();
      items = await readDir(baseDir);
      items = items.filter((it) => it.name.toLowerCase().indexOf(filterLC) >= 0);
    }
    const resultA: AbsPathScanResult[] = [];
    const resultB: AbsPathScanResult[] = [];
    const resultC: AbsPathScanResult[] = [];
    const resultD: AbsPathScanResult[] = [];
    items.forEach((it) => {
      if (it.name === '.DS_Store') return;
      if (it.name.startsWith('._')) return;

      const r = {
        isDir: it.isDirectory(),
        basename: it.name,
        fullPath: path.resolve(baseDir, it.name),
      };
      if (r.basename[0] !== '.') (r.isDir ? resultA : resultB).push(r);
      else (r.isDir ? resultC : resultD).push(r);
    });
    const comparator = (a: AbsPathScanResult, b: AbsPathScanResult) => {
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

export class WorkspaceStorageScanner {
  private readonly dir: string;

  result: WorkspaceStorageResult[] = [];
  /** key is lowercase remote name, value is raw remote name */
  readonly remoteNames = new Map<string, string>();

  constructor(private readonly urlSet: URLSet, dir: string) {
    this.dir = resolvePath(dir);
  }

  async scan() {
    const cache = await wsStorageCache.loadCache();
    if (cache) {
      this.result = cache;
      cache.forEach((it) => this.urlSet.add(it.uri.toString()));
      return;
    }

    const workspaces = await readDir(this.dir);
    const promises = workspaces.map(async (dir) => {
      if (!dir.isDirectory()) return;

      const jsonFile = path.resolve(this.dir, dir.name, 'workspace.json');
      const st = await stat(jsonFile);
      if (!st || !st.isFile()) return;
      if (st.size > maxWorkspaceJsonFileSize) return;

      try {
        const json = await readText(jsonFile);
        const storage = JSON.parse(json);
        return this.parseWorkspaceFolder(storage?.folder);
      } catch (error) {}
    });
    let result = await Promise.all(promises);
    result = result.filter((it) => {
      if (!it) return false;
      if (it.remoteName) this.remoteNames.set(it.remoteName.toLowerCase(), it.remoteName);
      return true;
    });
    this.result = result;
    wsStorageCache.saveCache(this.result);

    return result;
  }

  parseWorkspaceFolder = async (rawUri: string): Promise<WorkspaceStorageResult> => {
    if (!rawUri || typeof rawUri !== 'string') return;
    const uri = new URL(rawUri);
    if (this.urlSet.hasURL(uri)) return;
    this.urlSet.add(uri.toString());

    // Examples:
    // file:///path/to/dir
    // vscode-remote://ssh-remote%2Bvm1/path/to/dir
    // vscode-vfs://github/hangxingliu/repo
    // vscode-remote://codespaces%2Bhangxingliu-org-repo-xxxxxxxxxxxx/workspaces/repo
    const baseName = path.basename(uri.pathname);
    if (uri.protocol === 'file:') {
      if (!exists(uri.pathname)) return;
      return { uri, baseName, shortName: baseName };
    }

    let remoteType: WorkspaceRemoteType;
    let remoteName: string;
    if (uri.host === 'github') {
      remoteType = 'Github';
    } else {
      const mtx = uri.host.match(/^([\w\-]+)%2B(.+)$/);
      if (mtx) {
        switch (mtx[1]) {
          case 'codespaces':
            remoteType = 'Codespaces';
            break;
          case 'ssh-remote':
            remoteType = 'SSH';
            break;
          case 'wsl-remote':
            remoteType = 'WSL';
            break;
        }
        remoteName = mtx[2];
      }
    }
    return {
      uri,
      remoteType,
      remoteName,
      baseName,
      shortName: baseName,
    };
  };
}
