#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const config = require('../../workflow/js/config');
const target = path.resolve(__dirname, 'default.open-in-vscode.json');

fs.writeFileSync(target, JSON.stringify(config.defaultUserConfig, null, '\t'));
console.log(`generated '${target}'`);
