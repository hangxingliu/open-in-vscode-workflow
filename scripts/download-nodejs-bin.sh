#!/usr/bin/env bash

pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;
fetch() {
  test -f "$1" && return 0;
  curl -fL -o "$1" "$2" || exit 1;
}

set -x;
mkdir -p libs || exit 1;
cd libs || exit 1;

fetch 'node-darwin-arm64.tar.gz' 'https://nodejs.org/dist/v16.14.0/node-v16.14.0-darwin-arm64.tar.gz';
fetch 'node-darwin-x64.tar.gz' 'https://nodejs.org/dist/v16.14.0/node-v16.14.0-darwin-x64.tar.gz';

echo '
56e547d22bc7be8aa40c8cfd604c156a5bcf8692f643ec1801c1fa2390498542  node-darwin-arm64.tar.gz
26702ab17903ad1ea4e13133bd423c1176db3384b8cf08559d385817c9ca58dc  node-darwin-x64.tar.gz
' | sha256sum --check - || exit 1;

tar xf node-darwin-arm64.tar.gz || exit 1;
tar xf node-darwin-x64.tar.gz || exit 1;

cp ./node-v*-darwin-arm64/bin/node node_arm64 || exit 1;
cp ./node-v*-darwin-x64/bin/node node_x64 || exit 1;
cp ./node-v*-darwin-arm64/LICENSE LICENSE || exit 1;
cp ./node-v*-darwin-arm64/README.md README.md || exit 1;

rm -r ./node-v*-darwin-arm64 || exit 1;
rm -r ./node-v*-darwin-x64 || exit 1;

exit 0;
