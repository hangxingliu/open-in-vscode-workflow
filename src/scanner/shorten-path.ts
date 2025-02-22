import { basename } from 'path';
import { AlfredConfig, PrefixString } from '../alfred/config.js';

export class ShortenPath {
  //#region singleton
  private static instance: ShortenPath | undefined;
  static get() {
    if (!this.instance) this.instance = new ShortenPath();
    return this.instance;
  }
  static shorten(path: string) {
    return this.get().shorten(path);
  }
  //#endregion singleton
  private readonly pathToPrefix: [path: PrefixString, prefix: PrefixString][] = [];

  constructor() {
    const config = AlfredConfig.get();
    const addedPrefixes = new Set<PrefixString>();

    const customPrefixes = Object.entries(config.customPrefixes) as [PrefixString, PrefixString][];
    for (const [prefix, path] of customPrefixes) {
      if (addedPrefixes.has(prefix)) continue;
      addedPrefixes.add(prefix);
      this.pathToPrefix.push([path, prefix]);
    }

    const baseDirs = [...(config.scanDirectory?.baseDirs || [])];
    baseDirs.sort((a, b) => b.length - a.length);
    for (const baseDir of baseDirs) {
      const prefix: PrefixString = `${basename(baseDir)}/`;
      if (addedPrefixes.has(prefix)) continue;
      addedPrefixes.add(prefix);

      const path = AlfredConfig.normalizePrefix(baseDir);
      this.pathToPrefix.push([path, prefix]);
    }
    this.pathToPrefix.sort((a, b) => b[0].length - a[0].length);
  }

  shorten(path: string) {
    for (const [_path, prefix] of this.pathToPrefix)
      if (path.startsWith(_path)) return prefix + path.slice(_path.length);
    return path;
  }
}
