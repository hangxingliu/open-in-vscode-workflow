#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { AlfredFilter } from './alfred/types.js';
import { allVarieties } from './vscode-varieties.js';

if (require.main === module) main();
export async function main(devTest?: { input: string }) {
  let arg: string[] = [];
  if (typeof process.argv[2] !== 'undefined') {
    arg.push(process.argv[2]);
  }
  if (process.env.state_args_json) {
    try {
      const json = process.env.state_args_json;
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw `not an array`;
      arg = parsed;
    } catch (error) {
      console.error(`WARN: invalid JSON of state_args_json: ${String(error)}`);
    }
  }
  const filter = (devTest ? devTest.input : process.argv[2]) || '';
  let filterWord = filter.match(/[\W](\w+)$/)?.[1] || '';
  filterWord = filterWord.trim().toLowerCase();

  console.error(
    `Select an editor for ${JSON.stringify(arg)}, filter=${JSON.stringify(filterWord)}`
  );
  if (arg.length === 0) return;

  //
  const printResult = devTest ? false : true;
  const result: AlfredFilter.Result = { items: [] };
  for (const variety of allVarieties) {
    if (variety.app.endsWith('.app')) {
      const appPath = `/Applications/${variety.app}`;
      if (!existsSync(appPath)) continue;
    }
    if (
      filterWord &&
      !variety.app.toLowerCase().includes(filterWord) &&
      !variety.bin.toLowerCase().includes(filterWord)
    )
      continue;

    result.items.push({
      title: variety.app.replace(/\.app$/, ''),
      subtitle: variety.bin,
      arg,
      variables: {
        config_vscode_variety: variety.id,
      },
      icon: { path: variety.icon },
    });
  }
  if (printResult) console.log(JSON.stringify(result));
  return result;
}
