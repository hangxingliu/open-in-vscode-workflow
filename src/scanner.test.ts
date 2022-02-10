import { Config } from './config';
import { Scanner, workspaceStorageDirs, WorkspaceStorageScanner } from './scanner';
import { URLSet } from './utils';

main();
async function main() {
  const scanner = new WorkspaceStorageScanner(new URLSet(), workspaceStorageDirs.code);
  const items = await scanner.scan();
  items.forEach((item) => console.log(item.uri.toString()));
}

async function main2() {
  const config = new Config();
  await config.resolve();
  console.log(config.dump());

  const scanner = new Scanner(new URLSet(), config.scannerOptions);
  await scanner.scan();
  console.log(scanner.result);
}
