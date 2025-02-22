/**
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code
 */
export const CSI = "\x1b[";
//
//#region colors
//
export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const ITALIC = "\x1b[3m";
export const UNDERLINE = "\x1b[4m";
export const REVERSE = "\x1b[7m";
//
export const RED = "\x1b[31m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const BLUE = "\x1b[34m";
export const MAGENTA = "\x1b[35m";
export const CYAN = "\x1b[36m";
export const WHITE = "\x1b[37m";
//
//#endregion colors
//
export const SAVE_CURSOR = "\x1b[s";
export const RESTORE_CURSOR = "\x1b[u";
export const MOVE_CURSOR = (row = 1, column = 1) => `\x1b[${row};${column}H`;
export const PREV_LINE = (n = 1) => `\x1b[${n}F`;


/** @see https://github.com/chalk/ansi-regex/blob/main/index.js */
const ansiRegexPattern = [
  "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
  "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
].join("|");

export const ANSI_REGEXP = new RegExp(ansiRegexPattern, "");

export const ANSI_REGEXP_ALL = new RegExp(ansiRegexPattern, "g");
