export type SimpleType = number | string | boolean | SimpleType[] | { [x: string]: SimpleType };
export type SerializedItem<Item> = { [x in keyof Item]: SimpleType };

export type UserConfig = {
  baseDirs?: string[];
  attachDirs?: string[];

  pruningName?: string[];
  projectFiles?: string[];

  maxDepth?: number;

  customPrefixes?: { [prefix: string]: string };
};

export type ScannerOptions = {
  baseDirs: string[];
  attachDirs: string[];

  pruningNameRegex: RegExp[];
  projectFilesRegex: RegExp[];

  maxDepth: number;
};
export type ScannerState = {
  depth: number;
  parentIsProject: boolean;
};
export type ScannerResult = {
  fsPath: string;
  shortName: string;
  baseName: string;
  /** Example: "/path/to/projects/A/B" => "projects/A/B" */
  aliasPath: string;
};

export type WorkspaceRemoteType = 'Github' | 'Codespaces' | 'SSH' | 'WSL' | 'Docker';
export const workspaceRemoteTypeMap = new Map<string, WorkspaceRemoteType>([
  ['gh', 'Github'],
  ['github', 'Github'],
  ['codespace', 'Codespaces'],
  ['codespaces', 'Codespaces'],
  ['ssh', 'SSH'],
  ['wsl', 'WSL'],
  ['docker', 'Docker'],
]);

export type WorkspaceStorageResult = {
  uri: URL;
  shortName: string;
  baseName: string;
  remoteName?: string;
  remoteType?: WorkspaceRemoteType;
};

/**
 * @see https://www.alfredapp.com/help/workflows/inputs/script-filter/json/
 */
export type AlfredItem = {
  title: string;
  subtitle: string;
  arg: string[];
  uid?: string;
  icon?: { type: 'fileicon' | 'filetype'; path: string };
  valid?: boolean;
  match?: string;
  autocomplete?: string;
  type?: 'default' | 'file' | 'file:skipcheck';
  mods?: {
    alt?: Partial<AlfredItem>;
    cmd?: Partial<AlfredItem>;
  };
  text?: {
    /** ⌘C */
    copy?: string;
    /** ⌘L */
    largetype?: string;
  };
  quicklookurl?: string;
};
