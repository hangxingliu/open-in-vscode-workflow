#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const config = require('../../workflow/js/config');
const taregt = path.resolve(__dirname, 'default.open-in-vscode.json');

fs.writeFileSync(taregt, JSON.stringify(config.defaultUserConfig, null, '\t'));
console.log(`generated '${taregt}'`);
