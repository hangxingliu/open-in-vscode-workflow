#!/usr/bin/env bash

throw() { printf "fatal: %s\n" "$1" >&2; exit 1; }
print_cmd() { printf "\$ %s\n" "$*"; }
execute() { print_cmd "$@"; "$@" || throw "Failed to execute '$1'"; }
# https://stackoverflow.com/questions/2875424/correct-way-to-check-for-a-command-line-flag-in-bash
has_param() {
  local term="$1";
  shift;
  for arg; do [ "$arg" == "$term" ] && return 0; done
  return 1;
}
# goto the root of the project directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

build_all_workflows=false;
has_param "--all" "${@}" && build_all_workflows=true;

#
# main
#
execute git log --branches --all --decorate --oneline -n 5
execute corepack enable
execute yarn install
execute yarn run build
if $build_all_workflows; then
  execute ./scripts/download-nodejs-bin.sh
  execute ./scripts/distribute-workflow-files.sh --all
else
  execute ./scripts/distribute-workflow-files.sh
fi
