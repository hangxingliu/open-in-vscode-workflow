#!/usr/bin/env bash

export alfred_debug=1;
./node_modules/.bin/tsc &&
  node --enable-source-maps "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../workflow/js" "$@";
