import { basename } from 'node:path';
import { ParsedWorkspaceFolderUri, WorkspaceRemoteType } from './types.js';
import { homedir } from 'node:os';
import { exists } from '../../utils.js';

const checkedVolume = new Map<string, boolean>();
function volumeExists(filePath: string) {
  // '' / 'Volumes' / name
  const volumeName = filePath.split('/')[2];
  if (!volumeName) return false;

  const checked = checkedVolume.get(volumeName);
  if (typeof checked === 'boolean') return checked;

  const result = exists(`/Volumes/${volumeName}`);
  checkedVolume.set(volumeName, result);
  return result;
}

export const workspaceRemoteTypeMap = new Map<string, WorkspaceRemoteType>([
  ['gh', 'Github'],
  ['github', 'Github'],
  ['codespace', 'Codespaces'],
  ['codespaces', 'Codespaces'],
  ['ssh', 'SSH'],
  ['wsl', 'WSL'],
  ['docker', 'Docker'],
]);

export function parseWorkspaceFolderUri(url: URL): ParsedWorkspaceFolderUri | undefined {
  // if (!rawUri || typeof rawUri !== 'string') return;
  // const uri = new URL(rawUri);
  // if (this.urlSet.hasURL(uri)) return;
  // this.urlSet.add(uri.toString());

  // Examples:
  // file:///path/to/dir
  // vscode-remote://ssh-remote%2Bvm1/path/to/dir
  // vscode-vfs://github/hangxingliu/repo
  // vscode-remote://codespaces%2Bhangxingliu-xxxxxxxxxxxx/workspaces/repo
  const pathName = decodeURI(url.pathname);
  const baseName = basename(pathName);
  if (url.protocol === 'file:') {
    const filePath = pathName;
    if (filePath.startsWith('/Volumes')) {
      if (!volumeExists(filePath)) return;
    } else if (!exists(filePath)) {
      return;
    }
    return { url, baseName, shortName: baseName };
  }

  let remoteType: WorkspaceRemoteType | undefined;
  let remoteName: string | undefined;
  if (url.host === 'github') {
    remoteType = 'Github';
  } else {
    const mtx = url.host.match(/^([\w\-]+)%2B(.+)$/);
    if (mtx) {
      switch (mtx[1]) {
        case 'codespaces':
          remoteType = 'Codespaces';
          break;
        case 'ssh-remote':
          remoteType = 'SSH';
          break;
        case 'wsl-remote':
          remoteType = 'WSL';
          break;
        default:
          void 0; // debugger;
      }
      remoteName = mtx[2];
    }
  }

  return {
    url,
    remoteType,
    remoteName,
    baseName,
    shortName: baseName,
  };
}
