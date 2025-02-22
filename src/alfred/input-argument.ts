export class AlfredInputArg {
  //#region singleton
  private static instance: AlfredInputArg | undefined;
  static get(debugInput?: string) {
    if (!this.instance) this.instance = new AlfredInputArg(debugInput);
    return this.instance;
  }
  //#endregion singleton

  static readonly splitSegmentRegex = /[\s_-]+/;

  readonly str: string;
  readonly strLC: string;
  readonly args: string[];
  readonly length: number;
  private constructor(debugInput?: string) {
    const str = ((typeof debugInput === 'string' ? debugInput : process.argv[2]) || '').trim();

    this.str = str;
    this.length = str.length;
    this.strLC = str.toLowerCase();
    this.args = str.split(/\s+/);
  }

  getSegments(at?: number) {
    const str = typeof at === 'number' && at >= 0 ? this.args[at] || '' : this.str;
    const segments = str.split(AlfredInputArg.splitSegmentRegex);
    const fragmentsLC = segments.map((it) => it.toLowerCase());
    return { fragments: segments, fragmentsLC };
  }
}
