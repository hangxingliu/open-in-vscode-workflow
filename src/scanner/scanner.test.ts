import { URLSet } from '../utils';
import { AlfredConfig } from '../alfred/config.js';
import { ProjectDirectoryScanner } from './project-directory/index.js';
import { VSCodeWorkspaceScanner } from './vscode-workspace/index.js';
import { defaultVariety } from '../vscode-varieties.js';
import { WithPathPrefixScanner } from './scan-with-path-prefix.js';
import { homedir } from 'os';
import { loadDevEnv } from '../tests/utils.js';
import { getMatchingScore } from '../match/get-score.js';
import { AlfredInputArg } from '../alfred/input-argument.js';

loadDevEnv();
main2();

async function main() {
  const scanner = new VSCodeWorkspaceScanner(new URLSet(), defaultVariety.configDir);
  const items = await scanner.scan();
  items.forEach((item) => {
    if (item.url.protocol === 'file:') return;
    console.log(item.remoteName, item.shortName);
    console.log(item.url.toString());
  });
}

async function main2() {
  delete process.env.config_more_projects_dir;
  const config = AlfredConfig.get();
  const scanner = new ProjectDirectoryScanner(new URLSet(), config.scanDirectory!);
  await scanner.scan();

  const result = scanner.result;
  if (process.argv[2]) {
    const input = AlfredInputArg.get(process.argv[2]);
    result.forEach((it) => {
      Object.assign(it, {
        score: getMatchingScore(
          it.baseName.toLowerCase(),
          input.strLC,
          input.getSegments().fragmentsLC,
          50
        ),
      });
    });
  }
  console.log(result);
}

async function main3() {
  const result = await WithPathPrefixScanner.read(`${homedir()}/do`);
  console.log(result);
}
