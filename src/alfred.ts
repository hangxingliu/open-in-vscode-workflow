import * as path from 'path';
import { ScannerResult } from './types';

export class AlfredResults {
  private _prependItems = [];
  private _exactItems = [];
  private _items = [];
  count = 0;

  add(scanResultItem: ScannerResult, relativePath: string, exact = false) {
    const fullPath = scanResultItem.path;
    const basename = path.basename(fullPath);

    let title = basename;
    if (scanResultItem.projectPath) {
      title = path.join(
        path.basename(scanResultItem.projectPath),
        path.relative(scanResultItem.projectPath, fullPath)
      );
    }
    // https://www.alfredapp.com/help/workflows/inputs/script-filter/json/
    (exact ? this._exactItems : this._items).push({
      title,
      subtitle: relativePath,
      arg: fullPath,
      autocomplete: basename,
      text: { copy: fullPath, largetype: basename },
      quicklookurl: fullPath,
    });
    this.count++;
  }

  addAbsolutePath(matchedPrefix: string, matchedPrefixPath: string, absPath: string) {
    const basename = path.basename(absPath);
    const absPathAbbr = absPath.replace(matchedPrefixPath, matchedPrefix);
    this._prependItems.push({
      title: basename,
      subtitle: absPathAbbr,
      autocomplete: absPathAbbr,
      arg: absPath,
      text: { copy: absPath, largetype: basename },
      icon: { type: 'fileicon', path: absPath },
      quicklookurl: absPath,
    });
  }

  addNewWindowItem(items?: any[]) {
    (items || this._items).unshift({
      title: '+ New Window',
      subtitle: 'Open a new Visual Studio Code window',
      arg: '--new-window',
    });
  }

  toString() {
    const items = [].concat(this._prependItems).concat(this._exactItems).concat(this._items);
    if (items.length === 0) this.addNewWindowItem(items);
    if (process.env.__TEST_WORKFLOW) return JSON.stringify({ items }, null, 2);
    return JSON.stringify({ items });
  }
}
