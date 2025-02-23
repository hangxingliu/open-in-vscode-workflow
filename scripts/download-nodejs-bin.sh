#!/usr/bin/env bash

NODEJS_VERSION=v22.14.0
NODEJS_FILES=(
  "node-${NODEJS_VERSION}-darwin-arm64.tar.gz"
  node_arm64
  e9404633bc02a5162c5c573b1e2490f5fb44648345d64a958b17e325729a5e42

  "node-${NODEJS_VERSION}-darwin-x64.tar.gz"
  node_x64
  6698587713ab565a94a360e091df9f6d91c8fadda6d00f0cf6526e9b40bed250
)
TAR_GZ_DIR=libs
TARGET_DIR=libs
[ -n "$NODEJS_DIST_DIR" ] && TAR_GZ_DIR="$NODEJS_DIST_DIR";


throw() { printf "${RED}fatal: %s${RESET}\n" "$1" >&2; exit 1; }
print_cmd() { printf "${CYAN}\$ %s${RESET}\n" "$*"; }
execute() { print_cmd "$@"; "$@" || throw "Failed to execute '$1'"; }
fetch() {
  local download_url="$1" file_name="$1" sha256sum="$2";
  file_name="${file_name%%'#'*}";
  file_name="${file_name%%'?'*}";
  file_name="${file_name##*'/'}";

  test -f "${TAR_GZ_DIR}/${file_name}" ||
    execute curl -fLo "${TAR_GZ_DIR}/${file_name}" "$download_url";
}
RED="\x1b[31m";
CYAN="\x1b[36m";
RESET="\x1b[0m";

# change the current directory to the project directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

execute mkdir -p "${TARGET_DIR}";

TARGET_DIR="$(cd -- "${TARGET_DIR}" && pwd)";
TAR_GZ_DIR="$(cd -- "${TAR_GZ_DIR}" && pwd)";
[ -d "$TARGET_DIR" ] || throw "\$TARGET_DIR is not a directory";
[ -d "$TAR_GZ_DIR" ] || throw "\$TAR_GZ_DIR is not a directory";

execute cd "${TARGET_DIR}";
for (( i=0 ; i < ${#NODEJS_FILES[@]} ; i+=3 )); do
  file_name="${NODEJS_FILES[${i}]}";
  target_file_name="${NODEJS_FILES[$((i+1))]}";
  sha256sum="${NODEJS_FILES[$((i+2))]}";

  fetch "https://nodejs.org/dist/${NODEJS_VERSION}/${file_name}";
  echo "${sha256sum}  ${TAR_GZ_DIR}/${file_name}" | execute sha256sum --check -;

  dir_name="${file_name%".tar.gz"}";
  extract_files=(
    "${dir_name}/bin/node"
    "${dir_name}/LICENSE"
    "${dir_name}/README.md"
  );
  execute tar xzf "${TAR_GZ_DIR}/${file_name}" "${extract_files[@]}";

  execute cp "./${dir_name}/bin/node"  "${target_file_name}";
  execute cp "./${dir_name}/LICENSE"   "LICENSE";
  execute cp "./${dir_name}/README.md" "README.md";
  execute rm -r "./${dir_name}"
done
