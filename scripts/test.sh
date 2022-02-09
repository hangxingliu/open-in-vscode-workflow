#!/usr/bin/env bash

export __TEST_WORKFLOW=1;
./node_modules/.bin/tsc &&
  node "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../workflow/js" "$@";
