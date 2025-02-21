/**
 * @see https://github.com/github/gitignore/blob/main/Global/macOS.gitignore
 */
export const IGNORED_MACOS_FILES = new Set<string>([
  '.DS_Store',
  '.AppleDouble',
  '.LSOverride',
  //
  'Icon\r',
  //
  '.DocumentRevisions-V100',
  '.fseventsd',
  '.Spotlight-V100',
  '.TemporaryItems',
  '.Trashes',
  '.VolumeIcon.icns',
  '.com.apple.timemachine.donotpresent',
  //
  '.AppleDB',
  '.AppleDesktop',
  'Network Trash Folder',
  'Temporary Items',
  '.apdisk',
  //
  '.localized',
]);
