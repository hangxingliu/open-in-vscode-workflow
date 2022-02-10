import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const homedir = os.homedir();

export class URLSet extends Set<string> {
  hasURL = (url: URL | string) => {
    const str = typeof url === 'string' ? url : url.toString();
    return this.has(str);
  }
  hasFsPath = (fsPath: string) => this.hasURL(urlFromFsPath(fsPath));
  addFsPath = (fsPath: string) => {
    return this.add(urlFromFsPath(fsPath).toString());
  }
}

export function urlFromFsPath(fsPath: string) {
  return new URL(`file://${fsPath}`);
}

export function readBoolFromEnvironment(envName: string, defaultValue: boolean) {
  if (defaultValue)
    return /^(?:0|no?|f(?:alse)?|off)$/i.test(process.env[envName]) === false;
  return /^(?:1|y(es)?|t(?:ure)?|on)$/i.test(process.env[envName]);
}

export function exists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

export function stat(filePath: string): Promise<fs.Stats> {
  return new Promise((resolve) => {
    fs.stat(filePath, (error, stat) => resolve(error ? null : stat));
  });
}

export function resolvePath(p: string) {
  if (p === '~/') return homedir + '/';
  if (p.startsWith('~/')) p = path.resolve(homedir, p.slice(2));
  return p.replace(/\$(\w+)/g, (_, name) => process.env[name] || _);
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

export function readDirNames(dir: string): Promise<string[]> {
  return new Promise((resolve) => {
    fs.readdir(dir, (e, files) => resolve(e ? [] : files));
  });
}

export function readText(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (e, text) => (e ? reject(e) : resolve(text)));
  });
}

export function writeText(file: string, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, text, (e) => (e ? reject(e) : resolve()));
  });
}

export function isObject(obj: unknown): obj is object {
  return obj && typeof obj === 'object';
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
