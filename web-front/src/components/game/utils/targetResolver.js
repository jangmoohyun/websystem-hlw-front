// target 값을 배열 위치로 해석하는 유틸
export function resolveTargetToPos(indexMap, scriptLines, target) {
  if (target === undefined || target === null) return null;
  const map = indexMap?.current ?? new Map();
  const tnum = Number(target);
  if (!Number.isNaN(tnum)) {
    // 우선 map(스크립트의 index -> 배열 위치)을 검사해서 node.index 형태를 처리
    if (map.has(tnum)) return map.get(tnum);

    // map에 없으면 숫자를 배열 인덱스로 간주할 수 있는지 확인
    if (scriptLines && Number.isInteger(tnum)) {
      const nt = Number(tnum);
      if (nt >= 0 && nt < scriptLines.length) return nt;
    }
  }

  return null;
}
