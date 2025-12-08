import { useCallback, useState } from "react";
import { resolveTargetToPos } from "../utils/targetResolver";
import { getAccessToken } from "../../../utils/api.js";

export default function useChoiceHandler({
  currentNode,
  indexMapRef,
  scriptLines,
  storyId,
  setPos,
  setStoryId,
  goToNextSequential,
  setActiveCondition,
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

      // 즉시 condition을 설정하여 이후 네비게이션에서 사용할 수 있도록 함
      if (choice && typeof setActiveCondition === "function") {
        setActiveCondition(choice.condition ?? null);
      }

      // choice.condition이 있으면 스크립트에서 다음으로 나오는 해당 condition을 가진
      // 노드를 찾아 바로 이동한다.
      const chosenCond = choice?.condition ?? null;
      if (chosenCond) {
        for (
          let i = (currentNode?.index || 0) + 1;
          i < scriptLines.length;
          i++
        ) {
          const n = scriptLines[i];
          if (!n) continue;
          const rawMeta = n.meta;
          const meta = Array.isArray(rawMeta) ? rawMeta[0] : rawMeta || {};
          if (meta && meta.condition === chosenCond) {
            setPos(i);
            return;
          }
        }
      }

      const candidateTargets = [];
      if (choice && typeof choice === "object") {
        candidateTargets.push(
          choice.targetIndex,
          choice.target,
          choice.nextIndex,
          choice.onSubmitTargetIndex
        );
      }

      // 서버처리가 필요한 경우 (호감도/분기 등)
      const needsServer =
        choice &&
        (choice.heroineName ||
          typeof choice.affinityDelta === "number" ||
          choice.branchStoryId);

      if (needsServer) {
        (async () => {
          try {
            const token = getAccessToken();
            const headers = { "Content-Type": "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch("/choices/select", {
              method: "POST",
              headers,
              credentials: "include",
              body: JSON.stringify({
                storyId,
                currentLineIndex: currentNode?.index,
                choiceIndex,
                choice,
              }),
            });

            if (res.status === 401) throw new Error("Authentication required");

            const json = await res.json();
            if (!json.success) throw new Error(json.message || "choice failed");

            const {
              action,
              storyId: nextStoryId,
              targetIndex,
            } = json.result || {};

            let serverCond = null;
            if (typeof setActiveCondition === "function") {
              serverCond =
                (json.result &&
                  (json.result.condition ||
                    json.result.canonicalChoice?.condition)) ||
                null;
              if (serverCond) setActiveCondition(serverCond);
              else setActiveCondition(choice?.condition ?? null);
            }

            // 선택에 따라 조건 처리
            const effectiveCond = serverCond || choice?.condition || null;
            if (effectiveCond) {
              for (
                let i = (currentNode?.index || 0) + 1;
                i < scriptLines.length;
                i++
              ) {
                const n = scriptLines[i];
                if (!n) continue;
                const rawMeta = n.meta;
                const meta = Array.isArray(rawMeta)
                  ? rawMeta[0]
                  : rawMeta || {};
                if (meta && meta.condition === effectiveCond) {
                  setPos(i);
                  return;
                }
              }
            }

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
              let resolved = null;
              for (const t of candidateTargets2) {
                const p = resolveTargetToPos(indexMapRef, scriptLines, t);
                if (p !== null) {
                  resolved = p;
                  break;
                }
              }
              if (resolved !== null) setPos(resolved);
              else goToNextSequential();
            }
            // eslint-disable-next-line no-unused-vars
          } catch (err) {
            if (typeof setActiveCondition === "function")
              setActiveCondition(null);
            goToNextSequential();
          }
        })();
        return;
      }

      // 로컬 분기 처리
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
      storyId,
      setStoryId,
      setActiveCondition,
    ]
  );

  return { showChoices, setShowChoices, choiceLabels, handleChoice };
}
