#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }
execute() { echo "$ $*"; "$@" || throw "failed to execute '$1'"; }
pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

command -v rsync >/dev/null || throw "rsync is not installed!";

FROM_DIR="./workflow";
ALFRED_WORKFLOWS_DIR="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows"
AWK_IF='/com.hangxingliu.open-in-vscode-workflow/{ok=1;} END{if(!ok)exit 1;}';

RSYNC_OPTS=(
  -a --xattrs --progress  --delete --iconv=utf-8
	--exclude='._*' --exclude='.DS_Store' --exclude='prefs.plist'
  --exclude='*.tsbuildinfo'
);

matched=
while read -r dir; do
  test -z "${dir}" && continue;
  test -f "${dir}/info.plist" || continue;

  if awk "$AWK_IF" "${dir}/info.plist"; then
    matched="${dir}";

    execute rsync "${RSYNC_OPTS[@]}" "${dir}/" "${FROM_DIR}";
    break;
  fi
done <<< "$(find "$ALFRED_WORKFLOWS_DIR" -type d -mindepth 1 -maxdepth 1)";
test -z "$matched" && throw "can't match workflow from '$ALFRED_WORKFLOWS_DIR'";
echo "done!";
