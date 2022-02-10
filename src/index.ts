#!/usr/bin/env node

import { AlfredResults } from './alfred';
import { Config } from './config';
import { AttachDirScanner, Scanner } from './scanner';

if (require.main === module) main();
export async function main() {
  const rawQuery = String(process.argv[2] || '').trim();
  const query = rawQuery.toLowerCase();

  const result = new AlfredResults();
  if (query.length < 2) {
    result.addNewWindowItem();
    return console.log(result.toString());
  }

  const config = new Config();
  await config.resolve();

  const scanner = new Scanner(config.scannerOptions);
  await scanner.scan();

  const allPrefixes = config.customPrefixes;
  const prefix = Object.keys(allPrefixes).find((it) => rawQuery.startsWith(it));
  if (prefix) {
    const matchedPath = allPrefixes[prefix];
    const pathPrefix = rawQuery.replace(prefix, matchedPath);
    const items = await AttachDirScanner.read(pathPrefix);
    items.forEach((it) => result.addAbsolutePath(prefix, matchedPath, it));
  }

  const queryParts = query.split(/[\s-]+/);
  /** All path be scanned by `scan` function */
  const pathArray = Array.from(scanner.result.keys());
  for (let i = 0; i < pathArray.length; i++) {
    let exact = true;
    const fullPath = pathArray[i];
    if (fullPath.indexOf(query) < 0) {
      const lowercase = fullPath.toLowerCase().replace(/-/g, '');
      if (queryParts.find((it) => lowercase.indexOf(it) < 0)) continue;
      exact = false;
    }
    const details = scanner.result.get(fullPath);
    result.add(details, config.getRelativePath(details.path), exact);
    if (result.count >= 20) break;
  }
  console.log(result.toString());
}
