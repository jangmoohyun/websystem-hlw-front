// target 값을 배열 위치로 해석하는 유틸
export function resolveTargetToPos(indexMap, scriptLines, target) {
  if (target === undefined || target === null) return null;
  const map = indexMap?.current ?? new Map();
  if (Number.isInteger(Number(target)) && scriptLines) {
    const nt = Number(target);
    if (nt >= 0 && nt < scriptLines.length) return nt;
  }

  const tnum = Number(target);
  if (!Number.isNaN(tnum)) {
    if (map.has(tnum)) return map.get(tnum);
    const block = Math.floor(tnum / 100);
    for (const [index, p] of map.entries()) {
      if (Math.floor(Number(index) / 100) === block) return p;
    }
  }

  return null;
}
