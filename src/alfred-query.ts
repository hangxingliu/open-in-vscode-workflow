type MatchRemoteQueryResult = {
  remoteLC: string;
  queryLC: string;
  fragmentsLC: string[];
  exact?: boolean;
};

export class AlfredQuery {
  static fragmentRegex = /[\s_-]+/;
  readonly rawLC: string;
  readonly args: string[];
  // readonly argsLC: string[];

  constructor(readonly raw: string) {
    this.rawLC = raw.toLowerCase();
    this.args = raw.split(/\s+/);
    // this.argsLC = this.args.map((it) => it.toLowerCase());
  }

  getFragments(at?: number) {
    const str = at >= 0 ? this.args[at] || '' : this.raw;
    const fragments = str.split(AlfredQuery.fragmentRegex);
    const fragmentsLC = fragments.map((it) => it.toLowerCase());
    return { fragments, fragmentsLC };
  }

  matchRemoteQuery(remoteNamesMap: Map<string, string>): MatchRemoteQueryResult {
    let mtx = this.raw.match(/^([\w-]+)\s*[\+\>]+\s*(.+)$/);
    if (mtx) {
      const queryLC = mtx[2].toLowerCase();
      return {
        remoteLC: mtx[1].toLowerCase(),
        queryLC,
        fragmentsLC: queryLC.split(AlfredQuery.fragmentRegex),
      };
    }
    mtx = this.raw.match(/^([\w-]+)(?:\s+(.+))?$/);
    if (mtx) {
      const remoteLC = mtx[1].toLowerCase();
      if (remoteNamesMap.has(remoteLC)) {
        const queryLC = (mtx[2] || '').toLowerCase();
        return {
          exact: true,
          remoteLC,
          queryLC,
          fragmentsLC: queryLC.split(AlfredQuery.fragmentRegex),
        };
      }
    }
  }

  static getScore(
    item: {
      // name: string;
      nameLC: string;
    },
    query: {
      // raw: string;
      rawLC: string;
      // fragments: string[];
      fragmentsLC: string[];
    },
    baseScore?: number
  ): number {
    if (!query.rawLC) return 0;

    let index = item.nameLC.indexOf(query.rawLC);
    if (index >= 0) {
      // endsWith
      if (index + query.rawLC.length >= item.nameLC.length) {
        if (index <= 1) return 100;
        return 99;
      }
      // contains
      return 90;
    }

    if (
      query.rawLC.length > 2 &&
      query.rawLC.length >= item.nameLC.length &&
      query.fragmentsLC.length <= 1
    )
      return 0;

    let addScore = 0;
    const tested = new Set<string>();
    item.nameLC.split(/[\s\/_-]+/).forEach((nameLC) => {
      if (tested.has(nameLC)) return;
      tested.add(nameLC);

      for (let j = 0; j < query.fragmentsLC.length; j++) {
        const strLC2 = query.fragmentsLC[j];
        if (nameLC === strLC2) {
          addScore += 4;
          query.fragmentsLC.splice(j, 1);
          return;
        }

        index = nameLC.indexOf(strLC2);
        // starts with
        if (index === 0) {
          addScore += 2;
          query.fragmentsLC.splice(j, 1);
          return;
        }

        // contains
        if (index > 0) {
          addScore += 1;
          query.fragmentsLC.splice(j, 1);
          return;
        }
      }
    });

    if (addScore > 0)
      return Math.min(100, (typeof baseScore === 'number' ? baseScore : 50) + addScore);
    return 0;
  }
}
