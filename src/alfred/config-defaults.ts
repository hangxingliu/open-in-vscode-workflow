export const SCAN_DEPTH = 3;
export const SCAN_PRUNING_NAME: ReadonlyArray<string | RegExp> = [
  /^[._]/,
  'node_modules',
  'cache',
  'dist',
  'logs',
];

export const SCAN_PROJECT_FILES: ReadonlyArray<string> = [
  // version control system directories
  '.git',
  '.svn',
  '.hg',
  // IDE config directories
  '.vscode',
  '.idea',
  // Common project files
  'Makefile',
  'README.md',
  // Node.js
  'package.json',
  // Java
  'gradle.properties',
  // Python
  'requirements.txt',
  'pyproject.toml',
  // Rust
  'Cargo.toml',
  // Golang
  'go.mod',
  // C/C++
  'CMakeLists.txt',
  // Ruby
  'Gemfile',
  // PHP
  'composer.json',
  // C#/Visual Studio
  // '*.sln'
];

export const CUSTOM_PREFIXES = {
  '/': '/',
  '~/': '~/',
} as const;
