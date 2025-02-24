#!/usr/bin/env bash

# alfred configs
#   config_vscode_path
#   config_vscode_variety
#   config_prepend_path

default_code_variety="vim";

# basic utils
log() { printf "%s\n" "$*" >&2; }
throw() { log "Fatal: $1"; exit 1; }
execute() { log "$ $*"; "$@" || throw "Failed to execute '$1'"; }

THIS_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )";
execute source "${THIS_DIR}/include/prepend_path.bash";
log "Number of the argument(s): ${#}";

code_bin="${default_code_variety}";
if [ -n "${config_vscode_path}" ]; then
  command -v "${config_vscode_path}" >/dev/null ||
    throw "Custom code editor is not a valid command: '${config_vscode_path}'";

  code_bin="${config_vscode_path}";
  log "Used custom path for code editor: ${code_bin}";
else
  [ -n "$config_vscode_variety" ] && _code_bin="$(command -v "${config_vscode_variety}")";

  if [ -n "$_code_bin" ]; then code_bin="${_code_bin}";
  else log "WARN: Invalid editor name: '${_code_bin}'";
  fi
  log "Used code variety ${code_bin}";
fi

printf "%s\n%s\n" "${code_bin}" "$1";
