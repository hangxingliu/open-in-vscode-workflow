export const SCAN_DEPTH = 3;
export const SCAN_PRUNING_NAME: ReadonlyArray<string | RegExp> = [
  /^[._]/,
  'node_modules',
  'cache',
  'dist',
  'logs',
];

export const SCAN_PROJECT_FILES: ReadonlyArray<string> = [
  '.git',
  '.svn',
  '.hg',
  //
  '.vscode',
  '.idea',
  //
  'package.json',
  'requirements.txt',
  'Cargo.toml',
  'go.mod',
  //
  'Makefile',
  'README.md',
];

export const CUSTOM_PREFIXES = {
  '/': '/',
  '~/': '~/',
};
