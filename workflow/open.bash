#!/usr/bin/env bash

IFS=':' read -ra path_arr <<< "$PATH";
has_path() {
  for p in "${path_arr[@]}"; do
    [ "$p" == "$1" ] && return 0;
  done;
  return 1;
}
add_path() {
  if ! has_path "$1" && test -d "$1"; then
    export PATH="${1}:${PATH}";
    echo "Exported path '$1' into \$PATH" >&2;
  fi
}

add_path "/usr/local/bin";
add_path "/opt/homebrew/bin";


next_opts=();
if [ -n "$1" ]; then
  workflow_config_file="${HOME}/.open-in-vscode.json"
  if [ "$1" == "$workflow_config_file" ] && [ ! -f "$workflow_config_file" ]; then
    cp default.open-in-vscode.json "$workflow_config_file" &&
      echo "Created '$workflow_config_file' from default config" >&2;
  fi

  next_opts+=("${@}");
else
  next_opts+=("--new-window");
fi

code="$(command -v code)";
if test -n "$code"; then code "${next_opts[@]}";
else open -a 'Visual Studio Code.app' "${next_opts[@]}";
fi
echo "Opened Visual Studio Code with argument: ${next_opts[@]}" >&2;
