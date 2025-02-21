export type ScannerState = {
  depth: number;
  parentIsProject: boolean;
};

export type ScannerResult = {
  fsPath: string;
  shortName: string;
  baseName: string;
  /** Example: "/path/to/projects/A/B" => "projects/A/B" */
  aliasPath: string;
};
