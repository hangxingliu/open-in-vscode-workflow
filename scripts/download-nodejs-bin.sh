#!/usr/bin/env bash
NODEJS_VERSION=v22.12.0

throw() { printf "${RED}fatal: %s${RESET}\n" "$1" >&2; exit 1; }
print_cmd() { printf "${CYAN}\$ %s${RESET}\n" "$*"; }
execute() { print_cmd "$@"; "$@" || throw "Failed to execute '$1'"; }
fetch() {
  local download_url="$1" file_name="$1";
  file_name="${file_name%%'#'*}";
  file_name="${file_name%%'?'*}";
  file_name="${file_name##*'/'}";

  test -f "$file_name" && return 0;
  execute curl -fLo "$file_name" "$download_url";
}
RED="\x1b[31m";
CYAN="\x1b[36m";
RESET="\x1b[0m";

# change the current directory to the project directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

execute mkdir -p libs;
execute cd libs;

fetch "https://nodejs.org/dist/${NODEJS_VERSION}/node-${NODEJS_VERSION}-darwin-arm64.tar.gz";
fetch "https://nodejs.org/dist/${NODEJS_VERSION}/node-${NODEJS_VERSION}-darwin-x64.tar.gz";

echo "
293dcc6c2408da21562d135b0412525e381bb6fe150d688edb58fe850d0f3e13  node-${NODEJS_VERSION}-darwin-arm64.tar.gz
52bc25dd026db7247c3c00439afdb83e95087248267f02d6c1a7250d1f896173  node-${NODEJS_VERSION}-darwin-x64.tar.gz
" | execute sha256sum --check -;

execute tar xzf "node-${NODEJS_VERSION}-darwin-arm64.tar.gz";
execute tar xzf "node-${NODEJS_VERSION}-darwin-x64.tar.gz";

execute cp ./node-${NODEJS_VERSION}-darwin-arm64/bin/node node_arm64;
execute cp ./node-${NODEJS_VERSION}-darwin-x64/bin/node node_x64;
execute cp ./node-${NODEJS_VERSION}-darwin-arm64/LICENSE LICENSE;
execute cp ./node-${NODEJS_VERSION}-darwin-arm64/README.md README.md;

execute rm -r ./node-v*-darwin-arm64;
execute rm -r ./node-v*-darwin-x64;

exit 0;
