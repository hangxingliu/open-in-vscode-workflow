#!/usr/bin/env bash

# alfred configs
#   config_vscode_path
#   config_vscode_variety
#   config_prepend_path

default_code_variety="code";

# known code variety
known_code_varieties=(
  code          "Visual Studio Code.app"
  code-insiders "Visual Studio Code - Insiders.app"
  codium        "VSCodium.app"
  cursor        "Cursor.app"
  # vim         "vim"
  # nvim        "nvim"
)

# basic utils
log() { printf "%s\n" "$*" >&2; }
throw() { log "Fatal: $1"; exit 1; }
execute() {
  log "$ $*";
  [ -n "$alfred_dryrun" ] && return 0;
  "$@" || throw "Failed to execute '$1'";
}

THIS_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )";
execute source "${THIS_DIR}/include/prepend_path.bash";

code_bin="${default_code_variety}";
if [ -n "${config_vscode_path}" ]; then
  command -v "${config_vscode_path}" >/dev/null ||
    throw "Custom code editor is not a valid command: '${config_vscode_path}'";
  code_bin="${config_vscode_path}";
  log "Used custom path for code editor: ${code_bin}";
else
  [ -n "$config_vscode_variety" ] && _code_bin="${config_vscode_variety}";

  for ((i=0;i<${#known_code_varieties[@]};i+=2)); do
		[[ "${known_code_varieties[$i]}" == "${_code_bin}" ]] || continue;
		code_app="${known_code_varieties[$i+1]}";
    break;
	done

  if [ -n "$code_app" ]; then code_bin="${_code_bin}";
  else log "WARN: Invalid code variety: '${code_bin}'";
  fi
  log "Used code variety ${code_bin} '${code_app}'";
fi

next_opts=();
if [ -n "$1" ]; then
  next_opts+=("${@}");
else
  next_opts+=("--new-window");
fi

code_bin="$(command -v "${code_bin}")";
if [ -n "${code_bin}" ]; then   execute "${code_bin}" "${next_opts[@]}";
elif [ -n "${code_app}" ]; then execute open -a "${code_app}" "${next_opts[@]}";
else throw "Available editor is not found";
fi
