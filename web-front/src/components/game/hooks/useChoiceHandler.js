import { useCallback, useState } from "react";
import { resolveTargetToPos } from "../utils/targetResolver";

export default function useChoiceHandler({
  currentNode,
  indexMapRef,
  scriptLines,
  storyId,
  setPos,
  setStoryId,
  goToNextSequential,
  setShowLoadOverlay,
}) {
  const [showChoices, setShowChoices] = useState(false);

  // 선택지 라벨 추출
  const choiceLabels = useCallback((node) => {
    if (!node?.choices) return [];
    return node.choices.map((c) => c?.text ?? "");
  }, []);

  // 선택지 선택 처리
  const handleChoice = useCallback(
    (choiceIndex) => {
      if (!currentNode) return;

      // 선택지 선택 시 처리 로직
      const choice = currentNode.choices?.[choiceIndex];
      setShowChoices(false);

      const candidateTargets = [];
      if (choice && typeof choice === "object") {
        candidateTargets.push(
          choice.targetIndex,
          choice.target,
          choice.nextIndex,
          choice.onSubmitTargetIndex
        );
      }

      // 호감도/분기/다른 스토리 이동 등 서버 처리가 필요한 경우
      const needsServer =
        choice &&
        (choice.heroineName ||
          typeof choice.affinityDelta === "number" ||
          choice.branchStoryId);

      if (needsServer) {
        (async () => {
          try {
            const res = await fetch("/choices/select", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: 1, // 개발용
                storyId,
                currentLineIndex: currentNode?.index,
                choiceIndex,
                choice,
              }),
            });

            const json = await res.json();
            if (!json.success) throw new Error(json.message || "choice failed");

            const {
              action,
              storyId: nextStoryId,
              targetIndex,
            } = json.result || {};

            if (action === "branch" && nextStoryId) {
              setStoryId(nextStoryId);
              setPos(0);
            } else if (action === "navigate") {
              const candidateTargets2 = [
                targetIndex,
                choice.targetIndex,
                choice.target,
                choice.nextIndex,
                choice.onSubmitTargetIndex,
              ];

              // 대사 라인을 이동해야 하는 경우(선택지에 따라 다른 대사 출력 시)
              let resolved = null;
              for (const t of candidateTargets2) {
                const p = resolveTargetToPos(indexMapRef, scriptLines, t);
                if (p !== null) {
                  resolved = p;
                  break;
                }
              }
              if (resolved !== null) setPos(resolved);
              else goToNextSequential(); // 다음 대사로
            }
          } catch {
            goToNextSequential(); // 다음 대사로
          }
        })();
        return;
      }

      // 서버 없는 로컬 분기 처리
      let resolved = null;
      for (const t of candidateTargets) {
        const p = resolveTargetToPos(indexMapRef, scriptLines, t);
        if (p !== null) {
          resolved = p;
          break;
        }
      }

      if (resolved !== null) {
        setPos(resolved);
        return;
      }
      goToNextSequential();
    },
    [
      currentNode,
      goToNextSequential,
      indexMapRef,
      scriptLines,
      setPos,
      setShowLoadOverlay,
      storyId,
      setStoryId,
    ]
  );

  return {
    showChoices,
    setShowChoices,
    choiceLabels,
    handleChoice,
  };
}
