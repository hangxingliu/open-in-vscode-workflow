import { workspaceStorageDirs, WorkspaceStorageScanner } from "./scanner";

const scanner = new WorkspaceStorageScanner(workspaceStorageDirs.code);
scanner.scan().then(it => console.log(it));
