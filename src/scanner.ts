import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ScannerOptions, ScannerResult, ScannerState, WorkspaceStorageResult } from './types';
import { readText, stat, isDir, readDir, resolvePath, exists } from './utils';

export const workspaceStorageDirs = {
  code: '~/Library/Application Support/Code/User/workspaceStorage',
};
const maxWorkspaceJsonFileSize = 512 * 1024;

const defaultCacheFileName = 'open-in-vscode-workflow-cachev2.json';
const defaultCacheMaxAge = 2 * 60 * 1000;

export class Scanner {
  result = new Map<string, ScannerResult>();
  opts: ScannerOptions;

  constructor(opts: ScannerOptions) {
    this.opts = Object.assign({}, opts);
    opts = this.opts;
    if (!opts.cacheFile && opts.cacheFile !== false) {
      const tmpdir = os.tmpdir();
      if (tmpdir) opts.cacheFile = path.resolve(tmpdir, defaultCacheFileName);
      else opts.cacheFile = false;
    }
    if (!opts.cacheMaxAge) opts.cacheMaxAge = defaultCacheMaxAge;
  }

  async scan() {
    if (await this.loadScanCache()) return;
    for (let i = 0; i < this.opts.baseDirs.length; i++) {
      const baseDir = this.opts.baseDirs[i];
      if (await isDir(baseDir)) {
        await this._scan(baseDir, { depth: 0 }).catch(console.error);
      }
    }
    for (let i = 0; i < this.opts.attachDirs.length; i++) {
      const attachDir = this.opts.attachDirs[i];
      if (await isDir(attachDir)) {
        this.result.set(attachDir, { path: attachDir });
      }
    }
    await this.writeScanCache();
  }

  private async _scan(p: string, state: ScannerState) {
    const { maxDepth, stopSignFileRegex, ignoreRegex } = this.opts;
    if (state.depth >= maxDepth) return;

    let isProjectRoot = false;
    const subDirectories = await new Promise<string[]>((resolve) => {
      fs.readdir(p, { withFileTypes: true }, (error, files) => {
        if (error) {
          console.error(error);
          return resolve([]);
        }
        const subDirectories = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (stopSignFileRegex.find((it) => it.test(file.name))) return resolve([]);

          if (!file.isDirectory()) continue;
          if (file.name === '.git' || file.name === '.svn' || file.name === '.hg')
            isProjectRoot = true;
          if (ignoreRegex.find((it) => it.test(file.name))) continue;
          subDirectories.push(path.resolve(p, file.name));
        }
        resolve(subDirectories);
      });
    });

    const projectPath = isProjectRoot ? p : state.projectPath;
    for (let i = 0; i < subDirectories.length; i++) {
      const dir = subDirectories[i];
      if (this.result.has(dir)) continue;
      this.result.set(dir, { path: dir, projectPath });
      await this._scan(dir, { depth: state.depth + 1, projectPath });
    }
  }

  private async loadScanCache() {
    if (!this.opts.cacheFile) return false;

    const tmpFileStat = await stat(this.opts.cacheFile);
    if (!tmpFileStat) return false;

    if (tmpFileStat.mtimeMs > Date.now() - this.opts.cacheMaxAge) {
      console.error(`matched cache file: '${this.opts.cacheFile}'`);
      try {
        this.result = new Map(JSON.parse(await readText(this.opts.cacheFile)));
        return true;
      } catch (error) {
        console.error(error);
      }
    }
    return false;
  }
  private async writeScanCache() {
    if (!this.opts.cacheFile) return false;

    try {
      fs.writeFileSync(this.opts.cacheFile, JSON.stringify(Array.from(this.result), null, 2));
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }
}

export class AttachDirScanner {
  static async read(attachDir: string) {
    let dir = attachDir;
    let st = await stat(dir);
    /** This value is false when prefix likes "projects/a" but it is true when prefix likes "projects" */
    let hasBaseName = false;
    if (!st) {
      dir = path.dirname(attachDir);
      st = await stat(dir);
      hasBaseName = true;
      if (!st) return [];
    }
    const items = [];
    if (!hasBaseName) items.push(dir);
    const fsItems = await readDir(dir);
    const dirItems = fsItems.filter((it) => it.isDirectory());
    dirItems.forEach((it) => {
      const absPath = path.join(dir, it.name);
      if (absPath.startsWith(attachDir)) items.push(absPath);
    });
    return items;
  }
}

export class WorkspaceStorageScanner {
  private readonly dir: string
  constructor(dir: string) {
    this.dir = resolvePath(dir);
  }

  async scan() {
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
      } catch (error) {
      }
    });
    let result = await Promise.all(promises);
    result = result.filter(it => it);
    return result;
  }

  parseWorkspaceFolder = async (uri: string): Promise<WorkspaceStorageResult> => {
    if (!uri || typeof uri !== 'string') return;
    const parsed = new URL(uri);
    switch (parsed.protocol) {
      case 'file:':
        if (!exists(parsed.pathname)) return;
        return { uri, fsPath: parsed.pathname };
      default:
        return { uri };
    }
  }

}
