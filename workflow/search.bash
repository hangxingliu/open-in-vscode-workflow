#!/usr/bin/env bash

log() { printf "%s\n" "$*" >&2; }
throw() { log "Fatal: $1"; exit 1; }
execute() { log "$ $*"; "$@" || throw "Failed to execute '$1'"; }

# checkout the directory of this script
pushd "$( dirname "${BASH_SOURCE[0]}" )" >&2 || exit 1;
execute source "./include/resolve_nodejs.bash";

nodejs_cmd=( "$node" );
# shellcheck disable=SC2154
[ "$alfred_debug" == 1 ] && nodejs_cmd+=( --enable-source-maps );
# nodejs_cmd+=( js/index-debug.js "${@}" );
nodejs_cmd+=( js/index.js "${@}" );
"${nodejs_cmd[@]}";
