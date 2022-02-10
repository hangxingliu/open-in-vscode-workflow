import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export function stat(filePath: string): Promise<fs.Stats> {
  return new Promise((resolve) => {
    fs.stat(filePath, (error, stat) => resolve(error ? null : stat));
  });
}

export function resolvePath(p: string) {
  if (p.startsWith('~/')) p = path.resolve(os.homedir(), p.slice(2));
  return p.replace(/\$(\w+)/g, (_, name) => process.env[name] || _);
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

export function readText(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (e, text) => (e ? reject(e) : resolve(text)));
  });
}

export function isObject(obj: unknown): obj is object {
  return obj && typeof obj === 'object';
}

export function parseRegExp(str: string) {
  if (!str) return plainTextToRegExp('');
  const mtx = str.match(/^\/(.+)\/(\w+)$/);
  if (!mtx) return plainTextToRegExp(str);
  return new RegExp(mtx[1], mtx[2]);
}
function plainTextToRegExp(text: string) {
  return new RegExp('^' + text.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&') + '$', 'i');
}
