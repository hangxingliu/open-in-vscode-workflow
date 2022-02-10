import * as path from 'path';
import { ScannerOptions, UserConfig } from './types';
import { isObject, parseRegExp, readText, resolvePath, stat } from './utils';

const userConfigFile = '~/.open-in-vscode.json';

const defaultUserConfig: UserConfig = {
  baseDirs: ['~/Documents'],
  attachDirs: [],
  maxDepth: 2,
  ignore: ['/^[._]/i', 'archived'],
  stopSignFile: ['package.json', 'node_modules'],
  customPrefixes: {
    'docs/': '~/Documents/',
    'downloads/': '~/Downloads/',
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
        console.error(`Load config file "${this.configFile}" failed: ${error.message}`);
      else console.error(error.message);
    }
  };

  private _resolve = async () => {
    const config = Object.assign({}, defaultUserConfig);
    config.customPrefixes = Object.assign(
      {
        '/': '/',
        '~/': '~/',
      },
      config.customPrefixes
    );

    this.configFile = resolvePath(userConfigFile);
    const st = await stat(this.configFile);
    if (st && st.isFile()) {
      const json = await readText(this.configFile);
      const config2: UserConfig = JSON.parse(json) || {};

      if (isObject(config2.customPrefixes)) Object.assign(config, config2.customPrefixes);
      if (Array.isArray(config2.baseDirs)) config.baseDirs = config2.baseDirs;
      if (Array.isArray(config2.attachDirs)) config.attachDirs = config2.attachDirs;
      if (Array.isArray(config2.ignore)) config.ignore = config2.ignore;
      if (Array.isArray(config2.stopSignFile)) config.stopSignFile = config2.stopSignFile;
      if (config2.maxDepth > 0) config.maxDepth = config2.maxDepth;
      console.error(`loaded user config: '${this.configFile}'`);
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
      ignoreRegex: config.ignore.map((it) => parseRegExp(it)),
      stopSignFileRegex: config.stopSignFile.map((it) => parseRegExp(it)),
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
}
