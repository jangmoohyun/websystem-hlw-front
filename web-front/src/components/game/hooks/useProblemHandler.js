import { useCallback, useEffect, useState } from "react";
import { resolveTargetToPos } from "../utils/targetResolver";
import { getAccessToken } from "../../../utils/api.js";

export default function useProblemHandler({
  currentNode,
  pos,
  storyProblems,
  setDisplayed,
  setIsAnimating,
  indexMapRef,
  scriptLines,
  storyHeroines,
  storyId,
  setShowLoadOverlay,
}) {
  const [showCodeOverlay, setShowCodeOverlay] = useState(false); // 코드 문제창 활성화여부
  const [problemData, setProblemData] = useState(null); // 현재 문제 데이터
  const [userCode, setUserCode] = useState(""); // 사용자가 작성한 코드

  const [canAdvance, setCanAdvance] = useState(true); // 문제 풀이 후 진행 가능 여부
  const [requiredProblemNodeIndex, setRequiredProblemNodeIndex] =
    useState(null); // 문제 노드 인덱스(진행 강제)
  const [resultData, setResultData] = useState(null); // 채점 결과 데이터
  const [pendingNextPos, setPendingNextPos] = useState(null); // 제출 후 적용할 다음 위치

  // problem 노드 입장/퇴장 처리
  useEffect(() => {
    if (!currentNode || currentNode.type !== "problem") {
      setShowCodeOverlay(false);
      setProblemData(null);
      setCanAdvance(true);
      setRequiredProblemNodeIndex(null);
      return;
    }

    (async () => {
      setDisplayed("");
      setIsAnimating(false);

      // storyProblems 기반으로 현재 문제 매핑
      try {
        const arr = storyProblems || [];
        let found = null;

        try {
          const nodes = Array.isArray(scriptLines) ? scriptLines : [];
          const countUpToPos = nodes
            .slice(0, Number(pos) + 1)
            .filter((n) => n && n.type === "problem").length;
          const orderIndex = Math.max(0, countUpToPos - 1);
          if (arr.length > 0) {
            if (orderIndex < arr.length) {
              found = arr[orderIndex];
            } else {
              found = arr[arr.length - 1];
            }
          }
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          // ignore and leave found null
        }

        if (!found) {
          setProblemData(null);
          setShowCodeOverlay(false);
          setCanAdvance(true);
          setRequiredProblemNodeIndex(null);
          return;
        }

        setProblemData(found);
        setShowCodeOverlay(true);
        setRequiredProblemNodeIndex(pos);
        setCanAdvance(false);
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        setProblemData(null);
        setCanAdvance(true);
        setRequiredProblemNodeIndex(null);
      }
    })();
  }, [
    currentNode,
    pos,
    scriptLines,
    setDisplayed,
    setIsAnimating,
    storyProblems,
  ]);

  // 제출 처리
  const handleSubmitCode = useCallback(
    async (override = {}) => {
      if (!currentNode) return;

      setShowLoadOverlay(true);
      try {
        let mappedLangId = null;
        if (currentNode?.speaker && Array.isArray(storyHeroines)) {
          const found = storyHeroines.find(
            (h) => h.name === currentNode.speaker
          );
          if (found && typeof found.languageId === "number")
            mappedLangId = found.languageId;
        }
        if (
          !mappedLangId &&
          Array.isArray(storyHeroines) &&
          storyHeroines.length > 0
        ) {
          const first = storyHeroines[0];
          if (first && typeof first.languageId === "number")
            mappedLangId = first.languageId;
        }
        const finalLangId = override.languageId ?? mappedLangId ?? 71;

        // 줄바꿈 정규화
        const normalizedSource = (override.code ?? userCode ?? "").replace(
          /\r\n/g,
          "\n"
        );

        const payload = {
          nodeIndex: pos,
          choiceId: currentNode?.choiceId ?? null,
          problemId: problemData?.id ?? null,
          sourceCode: normalizedSource,
          languageId: finalLangId,
        };

        // 제출 API 호출
        console.debug("[useProblemHandler] submitting payload", payload);

        const token = getAccessToken();
        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`/problems/${storyId}/submit-code`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "submission failed");

        const { passed, testResults, appliedAffinities } = json;
        setResultData({
          passed,
          testResults: testResults || [],
          appliedAffinities: appliedAffinities || [],
        });

        // 제출 성공 후 진행 허용 + 강제 index 해제
        setRequiredProblemNodeIndex(null);
        setCanAdvance(true);

        let target =
          currentNode?.codeProblem?.onSubmitTargetIndex ??
          currentNode?.codeProblem?.targetIndex ??
          null;

        // 조건부 대사 결정 (통과/실패에 따른 분기)
        if (target == null) {
          try {
            const conditionKey = passed ? "pass" : "fail";
            // 현재 위치(pos) 이후 노드만 검사하도록 slice 사용
            const nodes = Array.isArray(scriptLines)
              ? scriptLines.slice(Number(pos) + 1)
              : [];

            // meta가 배열로 들어올 수도 있으니 안전하게 확인
            const condNode = nodes.find((n) => {
              if (!n || !n.meta) return false;
              const rawMeta = Array.isArray(n.meta) ? n.meta[0] : n.meta;
              return rawMeta && rawMeta.condition === conditionKey;
            });

            if (condNode) {
              target = condNode.index;
              console.debug("[useProblemHandler] found conditional node", {
                conditionKey,
                foundIndex: condNode.index,
                pos,
              });
            } else {
              console.debug("[useProblemHandler] no conditional node found", {
                conditionKey,
                pos,
              });
            }
            // eslint-disable-next-line no-unused-vars
          } catch (e) {
            // ignore and fallback to sequential
            target = null;
          }
        }

        const p = resolveTargetToPos(indexMapRef, scriptLines, target);
        if (p !== null) {
          setPendingNextPos(p);
        } else {
          setPendingNextPos("sequential");
        }

        setShowCodeOverlay(false);
      } catch (e) {
        alert("제출 중 오류가 발생했습니다: " + (e.message || e));
      } finally {
        setShowLoadOverlay(false);
      }
    },
    [
      currentNode,
      indexMapRef,
      pos,
      problemData?.id,
      scriptLines,
      setShowLoadOverlay,
      storyHeroines,
      storyId,
      userCode,
    ]
  );

  return {
    showCodeOverlay,
    setShowCodeOverlay,
    problemData,
    userCode,
    setUserCode,
    handleSubmitCode,
    canAdvance,
    setCanAdvance,
    requiredProblemNodeIndex,
    setRequiredProblemNodeIndex,
    setShowLoadOverlay,
    resultData,
    setResultData,
    pendingNextPos,
    setPendingNextPos,
  };
}
