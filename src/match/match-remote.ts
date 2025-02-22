import { AlfredInputArg } from '../alfred/input-argument.js';

export type MatchRemoteQueryResult = {
  remoteLC: string;
  queryLC: string;
  fragmentsLC: string[];
  exact?: boolean;
};

export function matchRemoteQuery(
  input: AlfredInputArg,
  remoteNamesMap: Map<string, string>
): MatchRemoteQueryResult | undefined {
  // eg: ssh > test
  let mtx = input.str.match(/^([\w-]+)\s*[\+\>]+\s*(.+)$/);
  if (mtx) {
    const queryLC = mtx[2].toLowerCase();
    return {
      remoteLC: mtx[1].toLowerCase(),
      queryLC,
      fragmentsLC: queryLC.split(AlfredInputArg.splitSegmentRegex),
    };
  }

  mtx = input.str.match(/^([\w-]+)(?:\s+(.+))?$/);
  if (mtx) {
    const remoteLC = mtx[1].toLowerCase();
    if (remoteNamesMap.has(remoteLC)) {
      const queryLC = (mtx[2] || '').toLowerCase();
      return {
        exact: true,
        remoteLC,
        queryLC,
        fragmentsLC: queryLC.split(AlfredInputArg.splitSegmentRegex),
      };
    }
  }
}
