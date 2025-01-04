/**
 * A descriptor of Visual Studio Code variety.
 * Including the command, application name and icon
 */
export type VSCodeVariety = {
  id: string;
  /** The command of this variety for launching */
  bin: string;
  app: string;
  icon?: string;
  /** `~/Library/Application Support/${configDir}` */
  configDir: string;
};

export const allVarieties: ReadonlyArray<VSCodeVariety> = [
  {
    id: 'code',
    bin: 'code',
    app: 'Visual Studio Code.app',
    configDir: 'Code',
  },
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
];
export const defaultVariety = allVarieties[0];
