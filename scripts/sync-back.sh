#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }
pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

FROM_DIR="./workflow";
ALFRED4_WORKFLOWS_DIR="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows"
AWK_IF='/com.hangxingliu.open-in-vscode-workflow/{ok=1;} END{if(!ok)exit 1;}';

matched=
while read -r dir; do
  test -z "${dir}" && continue;
  test -f "${dir}/info.plist" || continue;

  if awk "$AWK_IF" "${dir}/info.plist"; then
    matched="${dir}";
    find "${dir}" -type f -mindepth 1 -maxdepth 1 -exec cp -v {} "$FROM_DIR" \; || exit 1;
    break;
  fi
done <<< "$(find "$ALFRED4_WORKFLOWS_DIR" -type d -mindepth 1 -maxdepth 1)";
test -z "$matched" || throw "can't match workflow from '$ALFRED4_WORKFLOWS_DIR'";
echo "done!";
