#!/usr/bin/env node

import { AlfredQuery } from './alfred-query';
import { AlfredResult } from './alfred-result';
import { Config } from './config';
import { AbsPathScanner, Scanner, workspaceStorageDirs, WorkspaceStorageScanner } from './scanner';
import { WorkspaceRemoteType, workspaceRemoteTypeMap } from './types';
import { URLSet } from './utils';

if (require.main === module) main();
export async function main() {
  const rawQuery = String(process.argv[2] || '').trim();
  const result = new AlfredResult();
  if (rawQuery.length < 2 && rawQuery != '/') {
    result.addNewWindowItem();
    return console.log(result.toString());
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

  const allPrefixes = config.customPrefixes;
  const prefix = Object.keys(allPrefixes)
    .sort((a, b) => b.length - a.length)
    .find((it) => rawQuery.startsWith(it));

  if (prefix) {
    const matchedPath = allPrefixes[prefix];
    const pathPrefix = matchedPath + rawQuery.slice(prefix.length);
    const items = await AbsPathScanner.read(pathPrefix);
    items.forEach((it) =>
      result.addAbsolutePath(it.isDir, it.basename, it.fullPath, prefix, matchedPath)
    );
    console.log(result.toString());
    return;
  }

  profiler.tick();
  const urlSet = new URLSet();
  const scanner = new Scanner(urlSet, config.scannerOptions);
  await scanner.scan();
  if (isDebug) profiler.tick('scan directories');

  const wsScanner = new WorkspaceStorageScanner(urlSet, workspaceStorageDirs.code);
  await wsScanner.scan();
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
      result.add(item, score);
      if (result.count >= result.maxItems * 2) break;
    }
  }
  if (isDebug) profiler.tick(`match from ${scanner.result.length} directories`);

  console.log(result.toString());
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
