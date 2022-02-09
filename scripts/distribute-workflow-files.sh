#!/usr/bin/env bash

command -v zip || exit 1;

pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

version="$(./scripts/validate-version.js)";
test -n "$version" || exit 1;
echo "version=${version}";

pushd ./workflow || exit 1;
mkdir -p ../dist || exit 1;

echo "[.] cleaning files";
find . -type f \( -name '._*' -o -iname '.DS_Store' -o -iname '*.js.map' \) -delete || exit 1;

if test -d libs; then rm -r libs || exit 1; fi
mkdir libs || exit 1;

echo "[.] packing workflow $version with arm64 Node.js runtime ...";
cp -v ../libs/node_arm64 ./libs/ || exit 1;
target_file="../dist/OpenInVSCode.arm64.alfredworkflow";
test -f "$target_file" && rm "$target_file";
zip -r "$target_file" . || exit 1;

echo "[.] packing workflow $version with arm64 Node.js runtime ...";
rm -r libs || exit 1;
mkdir libs || exit 1;
cp -v ../libs/node_x64 ./libs/ || exit 1;
target_file="../dist/OpenInVSCode.amd64.alfredworkflow";
test -f "$target_file" && rm "$target_file";
zip -r "$target_file" . || exit 1;

echo "[.] packing workflow $version without Node.js runtime ...";
rm -r libs || exit 1;
target_file="../dist/OpenInVSCode.alfredworkflow";
test -f "$target_file" && rm "$target_file";
zip -r "$target_file" . || exit 1;

ls -al ../dist
echo "[+] done!";
