import { useCallback, useEffect, useState } from "react";
import { resolveTargetToPos } from "../utils/targetResolver";
import { chooseLanguageId } from "../utils/heroineLanguage";

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
  goToNextSequential,
  setPos,
  setShowLoadOverlay,
}) {
  const [showCodeOverlay, setShowCodeOverlay] = useState(false); // 코드 문제창 활성화여부
  const [problemData, setProblemData] = useState(null); // 현재 문제 데이터
  const [userCode, setUserCode] = useState(""); // 사용자가 작성한 코드

  const [canAdvance, setCanAdvance] = useState(true); // 문제 풀이 후 진행 가능 여부
  const [requiredProblemNodeIndex, setRequiredProblemNodeIndex] =
    useState(null); // 문제 노드 인덱스(진행 강제)

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

      const pid = currentNode.meta?.problemId ?? null; // 스크립트 내 문제 ID로 조회

      try {
        const arr = storyProblems || [];
        let found = null;

        if (pid) {
          const foundById = arr.find((p) => String(p.id) === String(pid));
          found = foundById || null;
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
  }, [currentNode, pos, setDisplayed, setIsAnimating, storyProblems]);

  // 제출 처리
  const handleSubmitCode = useCallback(
    async (override = {}) => {
      if (!currentNode) return;

      setShowLoadOverlay(true);
      try {
        // 히로인 기반 언어 선택 (override가 있으면 그걸 우선)
        // 기본 매핑 로직은 utils/heroineLanguage.js로 위임
        const mappedLangId = chooseLanguageId(
          currentNode?.speaker,
          storyHeroines
        );
        const finalLangId = override.languageId ?? mappedLangId;

        // 줄바꿈 정규화
        const normalizedSource = (override.code ?? userCode ?? "").replace(
          /\r\n/g,
          "\n"
        );

        const payload = {
          userId: 1, // 개발용
          nodeIndex: pos,
          choiceId: currentNode?.choiceId ?? null,
          problemId: problemData?.id ?? currentNode?.problemId ?? null,
          sourceCode: normalizedSource,
          languageId: finalLangId,
        };

        const res = await fetch(`/problems/${storyId}/submit-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "submission failed");

        const { passed, testResults, appliedAffinities } = json;
        const okCount = (testResults || []).filter((t) => t.ok).length;
        const total = (testResults || []).length;

        const title = passed ? "채점 통과" : "채점 실패";
        let msg = `${title}: ${okCount}/${total} 테스트 통과`;

        if (appliedAffinities && appliedAffinities.length > 0) {
          msg += "\n\n적용된 호감도 변화:\n";
          msg += appliedAffinities
            .map((a) => `${a.heroine}: ${a.delta} (now ${a.likeValue})`)
            .join("\n");
        }

        alert(msg);

        // 제출 성공 후 진행 허용 + 강제 index 해제
        setRequiredProblemNodeIndex(null);
        setCanAdvance(true);

        const target =
          currentNode?.codeProblem?.onSubmitTargetIndex ??
          currentNode?.codeProblem?.targetIndex;

        const p = resolveTargetToPos(indexMapRef, scriptLines, target);
        if (p !== null) setPos(p);
        else goToNextSequential();

        setShowCodeOverlay(false);
      } catch (e) {
        alert("제출 중 오류가 발생했습니다: " + (e.message || e));
      } finally {
        setShowLoadOverlay(false);
      }
    },
    [
      currentNode,
      goToNextSequential,
      indexMapRef,
      pos,
      problemData?.id,
      scriptLines,
      setPos,
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
  };
}
