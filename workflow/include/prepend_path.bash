#!/usr/bin/env bash

# default configs
default_prepend_path=( "/usr/local/bin" "/opt/homebrew/bin" "$HOME/.cargo/bin" );

has_item() {
    local term="$1"; shift;
    for arg; do [ "$arg" == "$term" ] && return 0; done
    return 1;
}

# Initialize all PATH into an array `sys_path_array` from system wide environment variable
IFS=':' read -ra sys_path_array <<< "$PATH";
# echo "<${sys_path_array[*]}>" >&2;

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
  echo "Prepend '$merged' into \$PATH" >&2;
}

# shellcheck disable=SC2154
if test -n "${config_prepend_path}"; then
  IFS=':' read -ra prepend_path_array <<< "${config_prepend_path}";
  add_path "${prepend_path_array[@]}";
else
  add_path "${default_prepend_path[@]}";
fi
