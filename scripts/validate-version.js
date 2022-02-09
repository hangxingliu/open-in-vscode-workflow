#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const fatal = (msg) => {
  console.error(`fatal: ${msg}`);
  process.exit(1);
};

const pkg = require('../package.json');
const plist = fs.readFileSync(path.resolve(__dirname, '../workflow/info.plist'), 'utf8');

const version1 = pkg.version;
const version2 = plist.match(/<key>version<\/key>\n\s+<string>([\d\.]+)/)[1];

if (version1 !== version2)
  fatal(
    `version ${version1} in the package.json is different with version ${version2} in the info.plist`
  );

console.log(version1);
