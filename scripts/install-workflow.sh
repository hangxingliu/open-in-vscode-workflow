#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }
execute() { echo "$ $*"; "$@" || throw "failed to execute '$1'"; }
execute_node_bin() {
  local bin_name="$1"; shift;
  if [ -f "node_modules/.bin/${bin_name}" ]; then
    execute "node_modules/.bin/${bin_name}" "${@}";
  else
    execute yarn "${bin_name}" "${@}";
  fi
}
command -v node >/dev/null || throw "node.js is not installed!"
command -v rsync >/dev/null || throw "rsync is not installed!";

# change the current directory to the project directory
pushd -- "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;
[ -n "$SKIP_BUILD" ] || execute_node_bin tsc;
execute node scripts/update-workflow-plist.mjs;

RSYNC_OPTS=(
  -a --xattrs --progress  --delete --iconv=utf-8
	--exclude='._*' --exclude='.DS_Store' --exclude='prefs.plist'
  --exclude='*.tsbuildinfo'
);

FROM_DIR="./workflow";
ALFRED_WORKFLOWS_DIR="$(node ./scripts/get-alfred-workflows-dir.mjs)";
echo "[ ] use workflows directory path '${ALFRED_WORKFLOWS_DIR}'";

[ -n "$ALFRED_WORKFLOWS_DIR" ] || throw "failed to get Alfred workflows directory";
[ -d "$ALFRED_WORKFLOWS_DIR" ] || throw "'$ALFRED_WORKFLOWS_DIR' is not a directory!";
[ -d "$FROM_DIR" ] || throw "'$FROM_DIR' is not a directory!";

TARGET_DIR="${ALFRED_WORKFLOWS_DIR}/vscode"
execute rsync "${RSYNC_OPTS[@]}" "${FROM_DIR}/" "${TARGET_DIR}";

echo "[+] done!";
