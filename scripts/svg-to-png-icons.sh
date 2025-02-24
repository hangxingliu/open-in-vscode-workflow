#!/usr/bin/env bash

INPUT=(
  # file name  width  padding
  vim.svg      512    48
  neovim.svg   512    54
);
INPUT_DIR="res";
OUTPUT_DIR="workflow/icons";

throw() { printf "${RED}fatal: %s${RESET}\n" "$1" >&2; exit 1; }
print_cmd() { printf "${CYAN}\$ %s${RESET}\n" "$*"; }
execute() { print_cmd "$@"; "$@" || throw "Failed to execute '$1'"; }
RED="\x1b[31m";
CYAN="\x1b[36m";
RESET="\x1b[0m";

command -v magick >/dev/null || throw "magick is not installed!";

pushd "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

handle_input() {
  local file_name output_width padding;
  while [ "${#@}" -gt 0 ]; do
    file_name="$1"; shift;
    output_width="$1"; shift;
    padding="$1"; shift;

    input_file="${INPUT_DIR}/${file_name}";
    test -f "$input_file" || throw "'$input_file' is not a file";

    output_name="${file_name%.*}.png"
    output_file="${OUTPUT_DIR}/${output_name}";

    output_width=$((output_width - padding * 2));

    convert_args=(
      -background none
      -resize "${output_width}x"
      -bordercolor none
      -border "${padding}"
      "${input_file}"
      "${output_file}"
    );
    execute magick convert "${convert_args[@]}";
  done
}
handle_input "${INPUT[@]}";
