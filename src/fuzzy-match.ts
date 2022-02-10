export function fuzzyMatch(fullLC: string, matchLC: string) {
  if (matchLC.length < 3) return 0;

  let maxScore = 0;
  const firstCh = matchLC[0];
  const sub = matchLC.slice(1);
  for (let i = 0; i < fullLC.length; i++) {
    const ch = fullLC[i];
    if (ch !== firstCh) continue;

    let score = matchLC.length;
    let minus = 0;
    for (let j = i + 1, j2 = Math.min(fullLC.length, i + matchLC.length), k = 0; j < j2; j++, k++) {
      const test1 = fullLC[j];
      const test2 = sub[k];
      if (test1 === test2) {
        minus = 0;
        continue;
      }
      // there is a character is missing
      if (minus === 0 && fullLC[j + 1] === test2 && fullLC[j + 2] === sub[k + 1]) {
        score -= ++minus;
        j += 2;
        k += 1;
        continue;
      }
      score -= ++minus;
      if (score <= 0) break;
    }
    if (score > maxScore) maxScore = score;
  }

  return Math.min(0.99, (maxScore / matchLC.length) + (maxScore / fullLC.length) * 0.1);
}
