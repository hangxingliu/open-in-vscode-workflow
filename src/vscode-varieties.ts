/**
 * A descriptor of Visual Studio Code variety.
 * Including the command, application name and icon
 */
export type VSCodeVariety = {
  /** An identifier used to pass between each step in this Alfred workflow */
  id: string;
  /** The command for launching this program */
  bin: string;
  /** An macOS application name (eg, `${Application}.app`) or a human-readable name as its title */
  app: string;
  /** The path to the icon of this program */
  icon: string;
  /** `~/Library/Application Support/${configDir}` */
  configDir?: string;
};

export const defaultVariety = {
  id: 'code',
  bin: 'code',
  app: 'Visual Studio Code.app',
  configDir: 'Code',
  icon: 'icons/code.png',
} satisfies Required<VSCodeVariety>;

export const allVarieties: ReadonlyArray<Readonly<VSCodeVariety>> = [
  defaultVariety,
  {
    id: 'code-insiders',
    bin: 'code-insiders',
    app: 'Visual Studio Code Insiders.app',
    configDir: 'Code - Insiders',
    icon: 'icons/code-insiders.png',
  },
  {
    id: 'codium',
    bin: 'codium',
    app: 'VSCodium.app',
    configDir: 'VSCodium',
    icon: 'icons/codium.png',
  },
  {
    id: 'cursor',
    bin: 'cursor',
    app: 'Cursor.app',
    configDir: 'Cursor',
    icon: '/Applications/Cursor.app/Contents/Resources/Cursor.icns',
  },
  {
    id: 'vim',
    bin: 'vim',
    app: 'Vim',
    icon: 'icons/vim.png',
  },
  {
    id: 'nvim',
    bin: 'nvim',
    app: 'Neovim',
    icon: 'icons/neovim.png',
  },
];
