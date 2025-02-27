import { resolvePath } from '../utils.js';
import { allVarieties, defaultVariety, VSCodeVariety } from '../vscode-varieties.js';
import * as defaults from './config-defaults.js';

export type PrefixString = `${string}/`;
export type CustomPrefixMap = Record<PrefixString, PrefixString>;
export type ScanDirectoryConfig = {
  /** Enable scan cache to speed up subsequent scan */
  cacheEnabled: boolean;
  /** Enable scanning nested projects */
  nestedProjects: boolean;
  baseDirs: ReadonlyArray<string>;
  extraDirs: ReadonlyArray<string>;
  maxDepth: number;
  pruningNames: ReadonlyArray<RegExp | string>;
  projectFiles: ReadonlyArray<RegExp | string>;
};

/**
 * A class for loading and normalizing user's workflow config
 *
 * @see https://www.alfredapp.com/help/workflows/workflow-configuration/
 * @see https://www.alfredapp.com/help/workflows/script-environment-variables/
 */
export class AlfredConfig {
  //#region singleton
  private static instance: AlfredConfig | undefined;
  static get() {
    if (!this.instance) this.instance = new AlfredConfig();
    return this.instance;
  }
  //#endregion singleton

  readonly isDebugMode: boolean;

  readonly vscodeVariety: VSCodeVariety;
  readonly vscodeCustomPath: string | undefined;

  readonly scanDirectory: ScanDirectoryConfig | undefined;
  readonly scanWorkspaceHistory: boolean;

  /** Sorted prefix keys (longer to shorter) */
  readonly customPrefixKeys: PrefixString[];
  readonly customPrefixes: CustomPrefixMap;

  readonly cacheEnabled: boolean;

  private constructor() {
    /**
     * If the user currently has the debug panel open for this workflow.
     * This variable is only set if the user is debugging, and is set to value `1`.
     */
    this.isDebugMode = process.env.alfred_debug === '1';
    const rawConfig = {
      // keyword: process.env.config_keyword,
      vscodeVariety: process.env.config_vscode_variety,
      vscodeCustomPath: process.env.config_vscode_path,
      scanWorkspaces: process.env.config_scan_workspace,
      projectsDir: process.env.config_projects_dir,
      moreProjectsDir: process.env.config_more_projects_dir,
      scanDepth: process.env.config_scan_depth,
      nestedProjects: process.env.config_scan_sub_projects,
      cacheEnabled: process.env.config_cache_enabled,
      // prependPath: process.env.prepend_path,

      // To-Do:
      extraDirs: process.env.config_extra_dirs,
      prefixes: process.env.config_custom_prefixes,
    };

    //
    let variety: Readonly<VSCodeVariety> = defaultVariety;
    if (rawConfig.vscodeVariety) {
      const varietyName = rawConfig.vscodeVariety;
      const _variety = allVarieties.find((it) => it.id === varietyName);
      if (_variety) variety = _variety;
      else console.error(`WARN: unknown variety: "${varietyName}"`);
    }
    this.vscodeVariety = variety;

    //
    if (rawConfig.vscodeCustomPath) this.vscodeCustomPath = resolvePath(rawConfig.vscodeCustomPath);

    //
    this.cacheEnabled = !AlfredConfig.isFalse(rawConfig.cacheEnabled);
    this.scanWorkspaceHistory = AlfredConfig.isTrue(rawConfig.scanWorkspaces);

    //
    const prefixes: CustomPrefixMap = { ...defaults.CUSTOM_PREFIXES };
    if (rawConfig.prefixes) {
      try {
        const parsed: CustomPrefixMap = JSON.parse(rawConfig.prefixes);
        if (parsed && typeof parsed === 'object') {
          const entries = Object.entries(parsed);
          for (const [key, val] of entries)
            if (key && typeof val === 'string') prefixes[AlfredConfig.normalizePrefix(key)] = val;
        }
      } catch {
        // noop
      }
    }

    const prefixKeys = Object.keys(prefixes).sort((a, b) => b.length - a.length) as PrefixString[];
    for (const key of prefixKeys)
      prefixes[key] = AlfredConfig.normalizePrefix(resolvePath(prefixes[key]));
    this.customPrefixes = prefixes;
    this.customPrefixKeys = prefixKeys;

    //
    if (rawConfig.projectsDir) {
      const projectsDirs = [rawConfig.projectsDir];
      const more = (rawConfig.moreProjectsDir || '').split(/[\n:]+/).filter(Boolean);
      projectsDirs.push(...more);

      let extraDirs = (rawConfig.extraDirs || '').split(/[\n:]+/).filter(Boolean);
      extraDirs = Array.from(new Set(extraDirs.map(resolvePath)));

      const baseDirs = Array.from(new Set(projectsDirs.filter(Boolean).map(resolvePath)));
      const maxDepth = AlfredConfig.getPositiveInt(rawConfig.scanDepth, defaults.SCAN_DEPTH);
      const nestedProjects = !AlfredConfig.isFalse(rawConfig.nestedProjects);
      this.scanDirectory = {
        cacheEnabled: this.cacheEnabled,
        nestedProjects,
        baseDirs,
        extraDirs,
        maxDepth,
        pruningNames: defaults.SCAN_PRUNING_NAME,
        projectFiles: defaults.SCAN_PROJECT_FILES,
      };
    }
  }

  static isTrue(config: string | undefined) {
    return config && /^(?:1|y(es)?|t(?:ure)?|on)$/i.test(config) ? true : false;
  }
  static isFalse(config: string | undefined) {
    return config && /^(?:0|no?|f(?:alse)?|off)$/i.test(config) ? true : false;
  }
  static getPositiveInt(config: string | undefined, defaultVal: number): number {
    if (!config) return defaultVal;
    const val = parseInt(config, 10);
    if (!Number.isSafeInteger(val) || val < 0) return defaultVal;
    return val;
  }
  static normalizePrefix(prefix: string): PrefixString {
    return prefix.replace(/\/*$/, '/') as PrefixString;
  }
}
