#!/usr/bin/env node

import { AlfredQuery } from './alfred-query';
import { AlfredResult } from './alfred-result';
import { resultCache } from './cache';
import { Config } from './config';
import { fuzzyMatch } from './fuzzy-match';
import { AbsPathScanner, Scanner, workspaceStorageDirs, WorkspaceStorageScanner } from './scanner';
import { WorkspaceRemoteType, workspaceRemoteTypeMap } from './types';
import { readBoolFromEnvironment, URLSet } from './utils';

if (require.main === module) main();
export async function main() {
  const rawQuery = String(process.argv[2] || '').trim();
  const result = new AlfredResult();
  if (rawQuery.length < 2 && rawQuery !== '/') {
    result.addNewWindowItem();
    result.addConfigItem();
    return outputResult(result.getItems());
  }

  const profiler = createProfiler();
  const isDebug = process.env.alfred_debug === '1';

  const query = new AlfredQuery(rawQuery);
  const config = new Config();
  await config.resolve();
  if (isDebug) {
    profiler.tick('load config');
    console.error(config.dump());
  }

  if (query.rawLC === 'cfg' || query.rawLC === 'conf' || query.rawLC === 'config')
    result.addConfigItem();

  const allPrefixes = config.customPrefixes;
  const prefix = Object.keys(allPrefixes)
    .sort((a, b) => b.length - a.length)
    .find((it) => rawQuery.startsWith(it));

  // if the user is querying with the prefix of absolute path
  if (prefix) {
    const matchedPath = allPrefixes[prefix];
    const pathPrefix = matchedPath + rawQuery.slice(prefix.length);
    const items = await AbsPathScanner.read(pathPrefix);
    items.forEach((it) =>
      result.addAbsolutePath(it.isDir, it.basename, it.fullPath, prefix, matchedPath)
    );
    return outputResult(result.getItems());
  }

  profiler.tick();
  const urlSet = new URLSet();
  const scanner = new Scanner(urlSet, config.scannerOptions);
  if (readBoolFromEnvironment('scan_directories', true)) await scanner.scan();
  if (isDebug) profiler.tick('scan directories');

  const wsScanner = new WorkspaceStorageScanner(urlSet, workspaceStorageDirs.code);
  if (readBoolFromEnvironment('scan_code_workspace', true)) await wsScanner.scan();
  if (isDebug) profiler.tick('scan workspace storage');

  const { fragmentsLC } = query.getFragments();
  const matchRemote = query.matchRemoteQuery();
  let matchRemoteType: WorkspaceRemoteType;
  if (matchRemote) {
    matchRemoteType = workspaceRemoteTypeMap.get(matchRemote.remoteLC);
    if (isDebug) console.error(`debug: user is querying remote (${JSON.stringify(matchRemote)})`);
  }

  for (let i = 0; i < wsScanner.result.length; i++) {
    const item = wsScanner.result[i];
    let score = 0;
    if (matchRemote) {
      const { remoteLC, queryLC, fragmentsLC } = matchRemote;
      if (
        item.remoteName === remoteLC ||
        (matchRemoteType && matchRemoteType === item.remoteType)
      ) {
        score = AlfredQuery.getScore(
          { nameLC: item.shortName.toLowerCase() },
          { rawLC: queryLC, fragmentsLC },
          70
        );
      } else {
        continue;
      }
    } else {
      score = AlfredQuery.getScore(
        { nameLC: item.shortName.toLowerCase() },
        { rawLC: query.rawLC, fragmentsLC },
        50
      );
    }

    if (score <= 0) continue;
    result.addWorkspaceResult(item, score);
  }
  if (isDebug) profiler.tick(`match from ${wsScanner.result.length} workspace items`);

  for (let i = 0; i < scanner.result.length; i++) {
    const item = scanner.result[i];
    const score = AlfredQuery.getScore(
      { nameLC: item.shortName.toLowerCase() },
      { rawLC: query.rawLC, fragmentsLC },
      50
    );
    if (score > 0) {
      result.addScanResult(item, score);
      if (result.count >= result.maxItems * 2) break;
    }
  }
  if (isDebug) profiler.tick(`match from ${scanner.result.length} directories`);

  let items = result.getItems();
  if (items.length > 0) {
    resultCache.saveCache(items);
  } else {
    const prevItems = await resultCache.loadCache();
    console.error(`info: fuzzy matching "${query.rawLC}" from ${prevItems.length} prevItems`);
    items = prevItems
      .map((it) => {
        const score = fuzzyMatch(it.title.toLowerCase(), query.rawLC);
        if (score <= 0) return;
        return Object.assign(it, { score });
      })
      .filter((it) => it)
      .sort((a, b) => b.score - a.score)
      .map((it) => {
        if (isDebug) console.error(`debug: fuzzy matched "${it.title}" with score ${it.score}`);
        delete it.score;
        return it;
      });
  }
  return outputResult(items);

  function outputResult(items: unknown[]) {
    if (isDebug) console.log(JSON.stringify({ items }, null, 2));
    else console.log(JSON.stringify({ items }));
  }
}

function createProfiler() {
  let prev = process.hrtime.bigint();
  return {
    tick: (msg?: string) => {
      if (!msg) {
        prev = process.hrtime.bigint();
        return;
      }
      const now = process.hrtime.bigint();
      const diff = Number(now - prev) * 0.001;
      if (diff > 1000) console.error(`profiler: +${(diff * 0.001).toFixed(2)}ms ${msg}`);
      else console.error(`profiler: +${diff.toFixed(2)}µs ${msg}`);
      prev = now;
    },
  };
}
