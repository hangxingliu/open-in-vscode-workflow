import * as path from 'path';
import { AlfredFilter } from './types.js';
import { AlfredConfig } from './config.js';
import type { ScannerResult } from '../scanner/project-directory/types.js';
import type { ParsedWorkspaceFolderUri } from '../scanner/vscode-workspace/types.js';
import { CYAN, DIM, ITALIC, RESET } from '../ansi-escape.js';

type AlfredItem = AlfredFilter.Item;

/** 0-100, 101 for abs path, 102 for new windows */
export const maxScore = 102;

export class AlfredResult {
  private itemsByScore: AlfredItem[][];
  private defaultIcon?: AlfredItem['icon'];
  count = 0;

  constructor(readonly maxItems = 50) {
    this.itemsByScore = new Array(maxScore + 1).fill(null).map(() => []);

    const config = AlfredConfig.get();
    const customIconPath = config.vscodeVariety.icon;
    if (customIconPath) this.defaultIcon = { path: customIconPath };
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
        icon: this.defaultIcon,
      },
      score
    );
  }

  addWorkspaceResult(item: ParsedWorkspaceFolderUri, score = 50) {
    const { url, shortName, baseName } = item;
    if (url.protocol === 'file:') {
      const fullPath = decodeURI(url.pathname);
      this.addItem(
        {
          title: shortName,
          subtitle: fullPath,
          arg: [fullPath],
          text: { copy: fullPath, largetype: baseName },
          autocomplete: baseName,
          icon: this.defaultIcon,
        },
        score
      );
      return;
    }

    let title: string | undefined = item.remoteType;
    if (!title) title = 'Remote';
    title = `(${title}) `;
    if (item.remoteName) title += `${item.remoteName} > `;

    const basename = path.basename(item.url.pathname);
    title += basename;

    const arg: string[] = [];
    if (item.url.protocol === 'vscode-remote:') {
      arg.push('--remote', decodeURIComponent(item.url.host), item.url.pathname);
    } else {
      arg.push(`--folder-uri=${item.url.toString()}`);
    }

    this.addItem(
      {
        title,
        subtitle: item.url.pathname,
        arg,
        autocomplete: basename,
        text: { copy: item.url.pathname, largetype: basename },
        icon: this.defaultIcon,
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
        icon: this.defaultIcon || { type: 'fileicon', path: fullPath },
        quicklookurl: fullPath,
      },
      101
    );
  }

  addNewWindowItem() {
    this.addItem(
      {
        title: 'New window',
        subtitle: 'Open a new Visual Studio Code window',
        arg: ['--new-window'],
      },
      maxScore
    );
  }

  getItems() {
    const items: AlfredFilter.Item[] = [];
    let len = 0;
    for (let i = maxScore; i >= 0; i--) {
      const subItems = this.itemsByScore[i].slice(0, this.maxItems - len);
      items.push(...subItems);
      len += subItems.length;
      if (len > this.maxItems) break;
    }
    return items;
  }

  static getResult(items: AlfredResult | AlfredFilter.Item[], print: boolean) {
    if (items instanceof AlfredResult) items = items.getItems();
    const result: AlfredFilter.Result = { items };
    if (print) {
      if (AlfredConfig.get().isDebugMode) console.log(JSON.stringify(result, null, 2));
      else console.log(JSON.stringify(result));
    }
    return result;
  }

  static debugResult(result: AlfredFilter.Result) {
    let i = 1;
    for (const item of result.items) {
      const command = i < 10 ? `⌘ + ${i}` : '     ';
      process.stderr.write(
        `${CYAN}${item.title.padEnd(30)} ${DIM}${command}${RESET}\n` +
          `  ${ITALIC}${DIM}${item.subtitle}${RESET}\n`
      );
      i++;
    }
    process.stderr.write(`${DIM}total: ${result.items.length} item(s)${RESET}\n`);
  }
}
