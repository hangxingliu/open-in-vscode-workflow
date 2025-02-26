#!/usr/bin/env node
//@ts-check
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectDir = resolve(import.meta.dirname, '..');

const workflowREADME = resolve(projectDir, 'workflow/README.md');
const workflowPlist = resolve(projectDir, 'workflow/info.plist');

const regexpToMatchReadmeInPList = /(<key>readme<\/key>\s*<string>)[\s\S]+?(<\/string>)/;

if (!existsSync(workflowREADME)) throw new Error(`${workflowREADME} is not found`);
if (!existsSync(workflowPlist)) throw new Error(`${workflowPlist} is not found`);

const readmeContent = readFileSync(workflowREADME, 'utf-8');
const plistContent = readFileSync(workflowPlist, 'utf-8');

const escapedReadmeContent = readmeContent
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const newPListContent = plistContent.replace(
  regexpToMatchReadmeInPList,
  (_, prefix, suffix) => `${prefix}${escapedReadmeContent}${suffix}`
);

if (newPListContent !== plistContent) {
  writeFileSync(workflowPlist, newPListContent, 'utf-8');
  console.log('Updated info.plist with the latest README content.');
} else {
  console.log('No changes detected in README.md. info.plist remains unchanged.');
}
