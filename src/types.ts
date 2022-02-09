export type UserConfig = {
  baseDirs?: string[];
  attachDirs?: string[];

  ignore?: string[];
  stopSignFile?: string[];

  maxDepth?: number;

  customPrefixes?: { [prefix: string]: string };
};

export type ScannerOptions = {
  baseDirs: string[];
  attachDirs: string[];

  stopSignFileRegex: RegExp[];
  ignoreRegex: RegExp[];

  maxDepth: number;

  cacheFile?: string | false;
  cacheMaxAge?: number;
};

export type ScannerState = {
  depth: number;
  projectPath?: string;
};

export type ScannerResult = {
  path: string;
  projectPath?: string;
};

export type WorkspaceStorageResult = {
  uri: string;
  fsPath?: string;
  projectPath?: string;
};
