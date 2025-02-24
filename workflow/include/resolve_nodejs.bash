#!/usr/bin/env bash

# try to using Node.js installed in the system
node="$(command -v node 2>/dev/null)";
[ -x "$node" ] || node="/usr/local/bin/node";
[ -x "$node" ] || node="/opt/homebrew/bin/node";
[ -x "$node" ] || node="/usr/bin/node";

# find Node.js in nvm
if [ ! -x "$node" ] && [ -d "$HOME/.nvm/versions/node" ]; then
  nvm_node="$(find "$HOME/.nvm/versions/node" -type d -maxdepth 1 -mindepth 1 | head -n 1)";
  [ -n "$nvm_node" ] && [ -x "$nvm_node/bin/node" ] && node="$nvm_node/bin/node";
fi

# can't find Node.js in the system and this workflow contains Node.js binary file
if [ ! -x "$node" ] && [ -d "./libs" ]; then
  # get hardware architecture
  archi="$(uname -m)";
  case "$archi" in
    x86_64) node="./libs/node_x64";;
    arm64) node="./libs/node_arm64";;
    *) echo "Fatal: unknown architecture '$archi'" >&2; exit 1;
  esac
fi

# still can't find Node.js binary file
if ! [ -x "$node" ]; then
  echo "Fatal: can't find Node.js binary file" >&2;
  exit 1;
fi
