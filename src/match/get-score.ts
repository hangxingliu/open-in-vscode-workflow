export function getMatchingScore(
  nameLC: string,
  queryLC: string,
  queryFragmentsLC: ReadonlyArray<string>,
  baseScore?: number
): number {
  if (!queryLC) return 0;

  let index = nameLC.indexOf(queryLC);
  if (index >= 0) {
    // endsWith
    if (index + queryLC.length >= nameLC.length) {
      // same (case-insensitive)
      if (index === 0) return 100;
      return 98;
    }
    // startsWith
    if (index === 0) return 99;
    // contains
    return 90;
  }

  if (queryLC.length > 2 && queryLC.length >= nameLC.length && queryFragmentsLC.length <= 1)
    return 0;

  let addScore = 0;
  const tested = new Set<string>();
  const fragmentsLC = [...queryFragmentsLC];
  nameLC.split(/[\s\/_-]+/).forEach((nameLC) => {
    if (tested.has(nameLC)) return;
    tested.add(nameLC);

    for (let j = 0; j < queryFragmentsLC.length; j++) {
      const strLC2 = queryFragmentsLC[j];
      if (nameLC === strLC2) {
        addScore += 4;
        fragmentsLC.splice(j, 1);
        return;
      }

      index = nameLC.indexOf(strLC2);
      // starts with
      if (index === 0) {
        addScore += 2;
        fragmentsLC.splice(j, 1);
        return;
      }

      // contains
      if (index > 0) {
        addScore += 1;
        fragmentsLC.splice(j, 1);
        return;
      }
    }
  });

  if (typeof baseScore !== 'number') baseScore = 50;
  if (addScore > 0) return Math.min(100, baseScore + addScore);
  return 0;
}
