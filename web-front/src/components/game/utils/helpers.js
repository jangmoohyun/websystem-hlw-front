// 노드와 전체 히로인 수로 표시 방식(one/three)을 계산
export function computeVisibleHeroines(currentNode, storyHeroineCount) {
  const showThreeFlag = currentNode?.showThree === true;
  const manyDialogues =
    Array.isArray(currentNode?.dialogues) && currentNode.dialogues.length >= 3;
  const heroCount = storyHeroineCount;
  let visibleHeroines;
  if (heroCount === 1 && !showThreeFlag) visibleHeroines = "one";
  else if (showThreeFlag || manyDialogues || heroCount >= 3)
    visibleHeroines = "three";
  else visibleHeroines = "one";
  return visibleHeroines;
}
