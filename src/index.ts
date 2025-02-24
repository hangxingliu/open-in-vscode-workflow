#!/usr/bin/env node

import { CacheManager } from './alfred/cache-manager.js';
import { AlfredConfig } from './alfred/config.js';
import { AlfredInputArg } from './alfred/input-argument.js';
import { AlfredFilter } from './alfred/types.js';
import { resultCache, scanProjectCache, scanWorkspaceCache } from './cache-rules.js';
import { fuzzyMatch } from './match/fuzzy-match.js';
import { getMatchingScore } from './match/get-score.js';
import { matchRemoteQuery, MatchRemoteQueryResult } from './match/match-remote.js';
import { Profiler } from './profiler.js';
import { AlfredResult } from './alfred/result.js';
import { ProjectDirectoryScanner } from './scanner/project-directory/index.js';
import { ScannerResult } from './scanner/project-directory/types.js';
import { WithPathPrefixScanner } from './scanner/scan-with-path-prefix.js';
import { VSCodeWorkspaceScanner } from './scanner/vscode-workspace/index.js';
import { ParsedWorkspaceFolderUri, WorkspaceRemoteType } from './scanner/vscode-workspace/types.js';
import { workspaceRemoteTypeMap } from './scanner/vscode-workspace/utils.js';
import { URLSet } from './utils.js';
import { defaultVariety } from './vscode-varieties.js';

if (require.main === module) main();
export async function main(devTest?: { input: string }) {
  // console.error(process.env);
  // console.error(process.argv);

  const printResult = devTest ? false : true;
  const input = AlfredInputArg.get(devTest ? devTest.input : undefined);
  const config = AlfredConfig.get();
  const result = new AlfredResult();
  const urlSet = new URLSet();
  const profiler = new Profiler();

  if (input.length < 2 && !input.str.startsWith('/')) {
    result.addNewWindowItem();
    return AlfredResult.getResult(result, printResult);
  }

  // check if the user is querying with the prefix of absolute path
  const matchByPrefix = config.customPrefixKeys.find((it) => input.str.startsWith(it));
  if (matchByPrefix) {
    const basePath = config.customPrefixes[matchByPrefix];
    const prefix = basePath + input.str.slice(matchByPrefix.length);
    const items = await WithPathPrefixScanner.read(prefix);
    for (const it of items)
      result.addAbsolutePath(it.isDir, it.basename, it.fullPath, matchByPrefix, basePath);
    return AlfredResult.getResult(result, printResult);
  }

  let allWorkspaces: ParsedWorkspaceFolderUri[] = [];
  let allProjects: ScannerResult[] = [];
  let matchRemote: MatchRemoteQueryResult | undefined;

  if (config.scanDirectory) {
    const scanner = new ProjectDirectoryScanner(urlSet, config.scanDirectory);
    const cache = new CacheManager(scanProjectCache, config.cacheEnabled);
    allProjects = await scanner.scan(cache);
  }

  // scan vscode workspace history
  if (config.scanWorkspaceHistory) {
    const configDir = config.vscodeVariety.configDir || defaultVariety.configDir;
    const scanner = new VSCodeWorkspaceScanner(urlSet, configDir);
    const cache = new CacheManager(scanWorkspaceCache, config.cacheEnabled);
    allWorkspaces = await scanner.scan(cache);
    matchRemote = matchRemoteQuery(input, scanner.remoteNamesMap);
  }

  let matchRemoteType: WorkspaceRemoteType | undefined;
  let matchRemoteNameLC: string | undefined;
  let listAllInSpecifiedRemote = false;
  const { fragmentsLC } = input.getSegments();

  if (matchRemote) {
    matchRemoteNameLC = matchRemote.remoteLC;
    matchRemoteType = workspaceRemoteTypeMap.get(matchRemote.remoteLC);
    if (config.isDebugMode)
      console.error(`debug: user is querying remote (${JSON.stringify(matchRemoteType)})`);

    if (!matchRemote.queryLC) listAllInSpecifiedRemote = true;
    allWorkspaces = allWorkspaces.filter((it) => {
      if (matchRemoteType && it.remoteType !== matchRemoteType) return false;
      if (matchRemoteNameLC) {
        if (!it.remoteName) return false;
        if (it.remoteName.toLowerCase() !== matchRemoteNameLC) return false;
      }
      return true;
    });
  }

  for (let i = 0; i < allWorkspaces.length; i++) {
    const item = allWorkspaces[i];

    let score: number;
    if (listAllInSpecifiedRemote) {
      score = 70;
    } else {
      const itemNameLC = item.shortName.toLowerCase();
      itemNameLC;
      score = matchRemote
        ? getMatchingScore(itemNameLC, matchRemote.queryLC, matchRemote.fragmentsLC, 70)
        : getMatchingScore(itemNameLC, input.strLC, fragmentsLC, 50);
    }

    if (score <= 0) continue;
    result.addWorkspaceResult(item, score);
  }

  for (let i = 0, i2 = matchRemote?.exact ? 0 : allProjects.length; i < i2; i++) {
    const item = allProjects[i];
    const score = getMatchingScore(item.shortName.toLowerCase(), input.strLC, fragmentsLC, 50);
    if (score <= 0) continue;

    result.addScanResult(item, score);
  }

  //
  // filter again
  //
  const items = result.getItems();
  const cache = new CacheManager(resultCache, config.cacheEnabled);
  if (items.length > 0) {
    cache.saveCache(items);
  } else {
    const prevItems = await cache.loadCache();
    if (prevItems) {
      console.error(`info: fuzzy matching "${input.strLC}" from ${prevItems.length} prevItems`);

      const itemsWithScore: Array<AlfredFilter.Item & { score: number }> = [];
      for (const prev of prevItems) {
        const score = fuzzyMatch(prev.title.toLowerCase(), input.strLC);
        if (score <= 0) continue;
        itemsWithScore.push(Object.assign(prev, { score }));
      }
      itemsWithScore.sort((a, b) => b.score - a.score);

      for (const item of itemsWithScore) {
        if (config.cacheEnabled)
          console.error(`debug: fuzzy matched "${item.title}" with score ${item.score}`);
        delete (item as Partial<typeof item>).score;
        items.push(item);
      }
    }
  }
  return AlfredResult.getResult(items, printResult);
}
