#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }
pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

FROM_DIR="./workflow";
ALFRED4_WORKFLOWS_DIR="$HOME/Library/Application Support/Alfred/Alfred.alfredpreferences/workflows"

[ -d "$ALFRED4_WORKFLOWS_DIR" ] || throw "'$ALFRED4_WORKFLOWS_DIR' is not a directory!";
[ -d "$FROM_DIR" ] || throw "'$FROM_DIR' is not a directory!";

TARGET_DIR="${ALFRED4_WORKFLOWS_DIR}/vscode"
if test -d "$TARGET_DIR"; then
  rm -r "$TARGET_DIR" || exit 1;
fi
cp -rv "$FROM_DIR" "$TARGET_DIR" || throw "copy failed!";

echo "[+] done!";
