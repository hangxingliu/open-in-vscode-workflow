import * as path from 'path';
import { ScannerOptions, UserConfig } from './types';
import { isObject, parseRegExp, readText, resolvePath, stat } from './utils';

export const userConfigFile = '~/.open-in-vscode.json';

export const defaultUserConfig: UserConfig = {
  baseDirs: ['~/Documents'],
  attachDirs: [],
  maxDepth: 3,
  pruningName: ['/^[._]/', 'node_modules', 'cache', 'dist', 'logs'],
  projectFiles: [
    '.git',
    '.svn',
    '.hg',
    '.vscode',
    '.idea',
    'package.json',
    'Makefile',
    'README.md',
  ],
  customPrefixes: {
    '/': '/',
    '~/': '~/',
    'docs/': '~/Documents/',
  },
};

export class Config {
  scannerOptions: ScannerOptions;
  customPrefixes: { [prefix: string]: string };
  configFile: string;

  resolve = async () => {
    try {
      await this._resolve();
    } catch (error) {
      if (this.configFile)
        console.error(`error: load config file "${this.configFile}" failed: ${error.message}`);
      else console.error(error.message);
    }
  };

  private _resolve = async () => {
    const config = Object.assign({}, defaultUserConfig);
    this.configFile = resolvePath(userConfigFile);
    const st = await stat(this.configFile);
    if (st && st.isFile()) {
      const json = await readText(this.configFile);
      const config2: UserConfig = JSON.parse(json) || {};

      if (isObject(config2.customPrefixes)) Object.assign(config.customPrefixes, config2.customPrefixes);
      if (Array.isArray(config2.baseDirs)) config.baseDirs = config2.baseDirs;
      if (Array.isArray(config2.attachDirs)) config.attachDirs = config2.attachDirs;
      if (Array.isArray(config2.pruningName)) config.pruningName = config2.pruningName;
      if (Array.isArray(config2.projectFiles)) config.projectFiles = config2.projectFiles;
      if (config2.maxDepth > 0) config.maxDepth = config2.maxDepth;
      console.error(`info: loaded user config: '${this.configFile}'`);
    }

    const prefixes = Object.keys(config.customPrefixes);
    for (let i = 0; i < prefixes.length; i++) {
      const prefix = prefixes[i];
      const value = config.customPrefixes[prefix];
      if (typeof value !== 'string' || !value) {
        delete config.customPrefixes[prefix];
        continue;
      }
      config.customPrefixes[prefix] = resolvePath(value);
    }

    this.scannerOptions = {
      baseDirs: config.baseDirs.map((it) => resolvePath(it)),
      attachDirs: config.attachDirs.map((it) => resolvePath(it)),
      pruningNameRegex: config.pruningName.map((it) => parseRegExp(it)),
      projectFilesRegex: config.projectFiles.map((it) => parseRegExp(it)),
      maxDepth: config.maxDepth,
    };
    this.customPrefixes = config.customPrefixes;
  };

  getRelativePath = (p: string): string => {
    if (!this.scannerOptions || !p) return p;
    for (let i = 0; i < this.scannerOptions.baseDirs.length; i++) {
      const from = this.scannerOptions.baseDirs[i];
      if (!p.startsWith(from)) continue;
      return path.basename(from) + p.slice(from.length);
    }
    return p;
  };

  dump = () => {
    const { baseDirs, attachDirs, pruningNameRegex, projectFilesRegex, maxDepth } =
      this.scannerOptions;
    const result: string[] = [
      `scannerOptions = {`,
      `  baseDirs: ${JSON.stringify(baseDirs)}`,
      `  attachDirs: ${JSON.stringify(attachDirs)}`,
      `  pruningNameRegex: ${JSON.stringify(pruningNameRegex.map((it) => it.toString()))}`,
      `  projectFilesRegex: ${JSON.stringify(projectFilesRegex.map((it) => it.toString()))}`,
      `  maxDepth: ${JSON.stringify(maxDepth)}`,
      `}`,
      `customPrefixes = ${JSON.stringify(this.customPrefixes)}`,
    ];
    return result.join('\n');
  };
}
