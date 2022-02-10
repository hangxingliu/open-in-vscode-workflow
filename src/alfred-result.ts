import * as path from 'path';
import { userConfigFile } from './config';
import { AlfredItem, ScannerResult, WorkspaceStorageResult } from './types';
import { resolvePath } from './utils';

/** 0-100, 101 for abs path, 102 for new windows */
export const maxScore = 102;

export class AlfredResult {
  private itemsByScore: AlfredItem[][];
  count = 0;

  constructor(readonly maxItems = 50) {
    this.itemsByScore = new Array(maxScore + 1).fill(null).map(() => []);
  }

  private addItem = (item: AlfredItem, score: number) => {
    score = Math.floor(score);
    if (score <= 0) return -1;
    if (score > maxScore) return -1;

    this.itemsByScore[score].push(item);
    this.count++;
  };

  addScanResult(item: ScannerResult, score = 50) {
    this.addItem(
      {
        title: item.shortName,
        subtitle: item.aliasPath,
        arg: [item.fsPath],
        autocomplete: item.baseName,
        text: { copy: item.fsPath, largetype: item.baseName },
        quicklookurl: item.fsPath,
      },
      score
    );
  }

  addWorkspaceResult(item: WorkspaceStorageResult, score = 50) {
    const { uri, shortName, baseName } = item;
    if (uri.protocol === 'file:') {
      const fullPath = uri.pathname;
      this.addItem(
        {
          title: shortName,
          subtitle: fullPath,
          arg: [fullPath],
          text: { copy: fullPath, largetype: baseName },
          autocomplete: baseName,
        },
        score
      );
      return;
    }

    let title: string = item.remoteType;
    if (!title) title = 'Remote';
    title = `(${title}) `;
    if (item.remoteName) title += `${item.remoteName} > `;

    const basename = path.basename(item.uri.pathname);
    title += basename;

    const arg: string[] = [];
    if (item.uri.protocol === 'vscode-remote:') {
      arg.push('--remote', decodeURIComponent(item.uri.host), item.uri.pathname);
    } else {
      arg.push(`--folder-uri=${item.uri.toString()}`);
    }

    this.addItem(
      {
        title,
        subtitle: item.uri.pathname,
        arg,
        autocomplete: basename,
        text: { copy: item.uri.pathname, largetype: basename },
      },
      score
    );
  }

  addAbsolutePath(
    isDir: boolean,
    basename: string,
    fullPath: string,
    prefix: string,
    prefixMatchedPath: string
  ) {
    const abbrPath = prefix + fullPath.slice(prefixMatchedPath.length);
    this.addItem(
      {
        title: basename,
        subtitle: abbrPath,
        autocomplete: abbrPath + (isDir ? '/' : ''),
        arg: [fullPath],
        text: { copy: fullPath, largetype: basename },
        icon: { type: 'fileicon', path: fullPath },
        quicklookurl: fullPath,
      },
      101
    );
  }

  addNewWindowItem() {
    this.addItem(
      {
        title: '+ New window',
        subtitle: 'Open a new Visual Studio Code window',
        arg: ['--new-window'],
      },
      maxScore
    );
  }
  addConfigItem() {
    this.addItem(
      {
        title: 'Edit configuration for scanning projects',
        subtitle: userConfigFile,
        arg: [resolvePath(userConfigFile)],
        icon: { path: 'config.png' },
      },
      maxScore
    );
  }

  getItems() {
    const items = [];
    let len = 0;
    for (let i = maxScore; i >= 0; i--) {
      const subItems = this.itemsByScore[i].slice(0, this.maxItems - len);
      items.push(...subItems);
      len += subItems.length;
      if (len > this.maxItems) break;
    }
    return items;
  }
}
