import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';

const homedir = os.homedir();

export class URLSet extends Set<string> {
  hasURL = (url: URL | string) => {
    const str = typeof url === 'string' ? url : url.toString();
    return this.has(str);
  };
  hasFsPath = (fsPath: string) => this.hasURL(URLSet.getUrlFromFsPath(fsPath));
  addFsPath = (fsPath: string) => {
    return this.add(URLSet.getUrlFromFsPath(fsPath).toString());
  };

  static getUrlFromFsPath(fsPath: string) {
    return new URL(`file://${fsPath}`);
  }
}

export function exists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

export function stat(filePath: string): Promise<fs.Stats | null> {
  return new Promise((resolve) => {
    fs.stat(filePath, (error, stat) => resolve(error ? null : stat));
  });
}

/**
 * Resolve a path containing `~/` and environment variables
 * @returns A resolved path string
 */
export function resolvePath(p: string) {
  if (p === '~/') return homedir + '/';
  if (p.startsWith('~/')) p = path.resolve(homedir, p.slice(2));
  return p
    .replace(/\$(\w+)/g, (_, name) => process.env[name] || '')
    .replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] || '');
}

export function shortenPath(p: string) {
  if (p.startsWith(homedir)) return '~' + p.slice(homedir.length);
  return p;
}

export async function isDir(dir: string) {
  const st = await stat(dir);
  return st ? st.isDirectory() : false;
}

export function readDir(dir: string): Promise<fs.Dirent[]> {
  return new Promise((resolve) => {
    fs.readdir(dir, { withFileTypes: true }, (e, files) => resolve(e ? [] : files));
  });
}

export function parseRegExp(str: string) {
  if (!str) return plainTextToRegExp('');
  const mtx = str.match(/^\/(.+)\/(\w*)$/);
  if (!mtx) return plainTextToRegExp(str);
  return new RegExp(mtx[1], mtx[2]);
}
function plainTextToRegExp(text: string) {
  return new RegExp('^' + text.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&') + '$', 'i');
}
