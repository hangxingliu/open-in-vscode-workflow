#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }
pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

./node_modules/.bin/tsc || exit 1;

FROM_DIR="./workflow";

ALFRED_BASE_DIR="${HOME}/Library/Application Support/Alfred";
ALFRED_WORKFLOWS_DIR="${ALFRED_BASE_DIR}/Alfred.alfredpreferences/workflows";
ALFRED_PREFS_JSON="${ALFRED_BASE_DIR}/prefs.json";

function get_current_workflows_dir() {
  env ALFRED_PREFS_JSON="$ALFRED_PREFS_JSON" node -e '
  try {
    const fs = require("fs");
    const prefs = JSON.parse(fs.readFileSync(process.env.ALFRED_PREFS_JSON, "utf8"));
    if (prefs && prefs.current) console.log(prefs.current);
  } catch (error) {}
  ';
}
_ALFRED_WORKFLOWS_DIR="$(get_current_workflows_dir)";
if test -n "$_ALFRED_WORKFLOWS_DIR"; then
  ALFRED_WORKFLOWS_DIR="${_ALFRED_WORKFLOWS_DIR}/workflows";
  echo "[ ] use workflows directory path '${ALFRED_WORKFLOWS_DIR}' from prefs.json";
fi

[ -d "$ALFRED_WORKFLOWS_DIR" ] || throw "'$ALFRED_WORKFLOWS_DIR' is not a directory!";
[ -d "$FROM_DIR" ] || throw "'$FROM_DIR' is not a directory!";

TARGET_DIR="${ALFRED_WORKFLOWS_DIR}/vscode"
if test -d "$TARGET_DIR"; then
  rm -r "$TARGET_DIR" || exit 1;
fi
cp -rv "$FROM_DIR" "$TARGET_DIR" || throw "copy failed!";

echo "[+] done!";
