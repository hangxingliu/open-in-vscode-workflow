export type WorkspaceRemoteType = 'Github' | 'Codespaces' | 'SSH' | 'WSL' | 'Docker';

export type ParsedWorkspaceFolderUri = {
  url: URL;
  remoteType?: WorkspaceRemoteType;
  /**
   * * SSH host name
   */
  remoteName?: string;
  shortName: string;
  baseName: string;
};
