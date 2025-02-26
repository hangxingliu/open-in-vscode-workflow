#!/usr/bin/env node

import { AlfredInputArg } from './alfred/input-argument.js';
import { AlfredResult } from './alfred/result.js';
import { homedir } from 'os';

if (require.main === module) main();
export async function main(devTest?: { input: string }) {
  const printResult = devTest ? false : true;
  const input = AlfredInputArg.get(devTest ? devTest.input : undefined);
  const result = new AlfredResult();

  if (input.length < 2 && !input.str.startsWith('/')) {
    result.addNewWindowItem();
    return AlfredResult.getResult(result, printResult);
  }

  result.addWorkspaceResult({
    url: new URL(`vscode-remote://ssh-remote%2BGCP-01/projects/vscode-nginx-conf-hint`),
    remoteType: 'SSH',
    remoteName: 'GCP-01',
    shortName: 'vscode-nginx-conf-hint',
    baseName: 'vscode-nginx-conf-hint',
  }, 95);


  result.addWorkspaceResult({
    url: new URL(`vscode-remote://codespaces%2Bideal-carnival-w369vv59pqrtt7p/workspaces/nginx-conf`),
    remoteType: 'Codespaces',
    // cspell:disable-next-line
    remoteName: 'ideal-carnival-w369vv59pqrtt7p',
    shortName: 'nginx-conf',
    baseName: 'nginx-conf',
  }, 94);


  result.addScanResult({
    fsPath: homedir() + '/Documents/nginx-conf',
    baseName: 'nginx-conf',
    shortName: 'nginx-conf',
    aliasPath: 'Documents/nginx-conf',
  }, 93);

  return AlfredResult.getResult(result, printResult);
};
