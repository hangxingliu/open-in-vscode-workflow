#!/usr/bin/env node
//@ts-check
import { homedir } from 'node:os';
import { existsSync, readFileSync } from 'node:fs';

const home = homedir();

const baseDir = `${home}/Library/Application Support/Alfred`;
const defaultDir = `${baseDir}/Alfred.alfredpreferences/workflows`;
const alfredPrefs = `${baseDir}/prefs.json`;

if (existsSync(alfredPrefs)) {
  try {
    const prefs = JSON.parse(readFileSync(alfredPrefs, 'utf-8'));
    if (prefs && prefs.current && typeof prefs.current === 'string') {
      process.stdout.write(`${prefs.current}/workflows`);
      process.exit(0);
    }
  } catch (error) {
    process.stderr.write(`Failed to load Alfred's prefs.json: ${error.message}`);
  }
}
if (existsSync(defaultDir)) process.stdout.write(defaultDir);
else process.stderr.write(`The default Alfred workflows dir "${defaultDir}" doesn't exist`);
