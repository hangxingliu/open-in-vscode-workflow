#!/usr/bin/env bash
# shellcheck disable=SC2154

# alfred configs
#   config_vscode_path
#   config_vscode_variety

# default configs
default_prepend_path=( "/usr/local/bin" "/opt/homebrew/bin" "$HOME/.cargo/bin" );
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
has_item() {
    local term="$1"; shift;
    for arg; do [ "$arg" == "$term" ] && return 0; done
    return 1;
}

# Initialize all PATH into an array `sys_path_array` from system wide environment variable
IFS=':' read -ra sys_path_array <<< "$PATH";
# log "<${sys_path_array[*]}>";

add_path() {
  local path merged
  for path in "${@}"; do
    # shellcheck disable=SC2088
    [[ "$path" == '~/'* ]] && path="${HOME}${path#'~'}";
    has_item "$path" "${sys_path_array[@]}" && continue;
    test -d "$path" || continue;
    merged="${path}:${merged}";
  done
  [ -n "$merged" ] || return 0;
  export PATH="${merged}${PATH}";
  log "Prepend '$merged' into \$PATH";
}

if test -n "${prepend_path}"; then
  IFS=':' read -ra prepend_path_array <<< "${prepend_path}";
  add_path "${prepend_path_array[@]}";
else
  add_path "${default_prepend_path[@]}";
fi

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
