import React, { useCallback, useEffect, useState } from "react";
import Heroine from "./Heroine";
import DialogueBox from "./DialogueBox";
import CodeOverlay from "./CodeOverlay";
import Menu from "./Menu";
import LoadOverlay from "../common/LoadOverlay";
import ChoiceOverlay from "./ChoiceOverlay";

import useStoryLoader from "./hooks/useStoryLoader";
import useTyping from "./hooks/useTyping";
import { resolveTargetToPos } from "./utils/targetResolver";
import { computeVisibleHeroines } from "./utils/helpers";

export default function GameScreen({ onGoHome, onSetting }) {
  // 테스트용 기본 스토리 ID: state로 관리하여 분기 시 변경 가능하게 함
  const [storyId, setStoryId] = useState(3300);

  // hook으로 스토리/스크립트 로드
  const {
    scriptLines,
    indexMapRef,
    heroineCount: storyHeroineCount,
  } = useStoryLoader(storyId);

  // 대사 진행 위치 (scriptLines의 인덱스)
  const [pos, setPos] = useState(0);

  // UI 상태
  const [showChoices, setShowChoices] = useState(false);
  const [showCodeOverlay, setShowCodeOverlay] = useState(false);
  const [showLoadOverlay, setShowLoadOverlay] = useState(false);
  const [userCode, setUserCode] = useState("");
  // problem node 상태
  const [problemData, setProblemData] = useState(null);

  // 현재 노드: pos는 scriptLines(전체 노드 배열)의 인덱스를 가리키도록 통일
  // 대사만을 대상으로 하는 이동은 findNextDialoguePos 헬퍼를 사용하여 처리
  const currentNode = Array.isArray(scriptLines)
    ? scriptLines[pos] ?? null
    : null;
  const activeSpeaker = currentNode?.speaker ?? null;

  // helper: scriptLines에서 다음 대사(또는 speaker가 있는 노드) 위치 찾기
  const findNextDialoguePos = useCallback(
    (from) => {
      if (!Array.isArray(scriptLines)) return null;
      for (
        let i = Math.max(0, (typeof from === "number" ? from : -1) + 1);
        i < scriptLines.length;
        i++
      ) {
        const n = scriptLines[i];
        if (!n) continue;
        // 내레이션/선택지도 표시 가능한 노드로 포함
        if (
          n.type === "dialogue" ||
          n.type === "narration" ||
          n.type === "choice" ||
          n.type === "problem" ||
          n.speaker
        )
          return i;
      }
      return null;
    },
    [scriptLines]
  );

  // 컴포넌트가 처음 로드되거나 story가 바뀌면 첫 대사 위치로 이동
  useEffect(() => {
    if (!Array.isArray(scriptLines) || scriptLines.length === 0) return;
    const first = scriptLines.findIndex(
      (n) =>
        n &&
        (n.type === "dialogue" ||
          n.type === "narration" ||
          n.type === "choice" ||
          n.speaker)
    );
    if (first >= 0) setPos(first);
  }, [scriptLines]);

  // 타이핑 훅
  const { displayed, isAnimating, setDisplayed, setIsAnimating } = useTyping(
    currentNode?.text ?? "",
    25
  );

  // 진행 기본: 다음 순차 노드
  const goToNextSequential = useCallback(() => {
    if (!scriptLines) return;
    const next = findNextDialoguePos(pos);
    if (next !== null) setPos(next);
    else setPos(Math.min(pos + 1, scriptLines.length - 1));
  }, [pos, findNextDialoguePos, scriptLines]);

  // 사용자의 진행(스페이스/클릭) — 우선은 대사만 순차 이동하도록 단순화
  const handleAdvance = useCallback(() => {
    if (!currentNode) return;

    // 현재 노드가 선택지인 경우, 진행 대신 선택 오버레이를 엽니다
    if (currentNode?.type === "choice") {
      setShowChoices(true);
      return;
    }

    if (isAnimating) {
      setDisplayed(currentNode.text ?? "");
      setIsAnimating(false);
      return;
    }

    // 다음 대사(또는 speaker가 있는 노드)로 이동
    const next = findNextDialoguePos(pos);
    if (next !== null) setPos(next);
  }, [
    currentNode,
    isAnimating,
    pos,
    setDisplayed,
    setIsAnimating,
    findNextDialoguePos,
  ]);

  //선택지 처리--------------------------------------------------
  const handleChoice = (choiceIndex) => {
    if (!currentNode) return;
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

    // 선택지에 메타데이터(호감도 또는 분기)가 있으면 서버로 POST하여 처리합니다
    const needsServer =
      choice &&
      (choice.heroineName ||
        typeof choice.affinityDelta === "number" ||
        choice.branchStoryId);
    if (needsServer) {
      (async () => {
        setShowLoadOverlay(true);
        try {
          const res = await fetch("/choices/select", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyId,
              currentLineIndex: currentNode?.index,
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
            // 서버가 분기할 storyId를 반환하면 이를 state로 갱신하여 스토리를 재로딩합니다.
            setStoryId(nextStoryId);
            // 스토리 변경 후 첫 대사로 이동(스크립트 로드에 의해 useEffect가 pos를 재설정할 것입니다)
            setPos(0);
            console.debug("Branch to story", nextStoryId);
          } else if (action === "navigate") {
            // 서버는 targetIndex/endIndex를 반환합니다; 프론트엔드에서 이를 배열 위치로 변환하여 이동합니다
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
        } catch (e) {
          console.error(e);
          goToNextSequential();
        } finally {
          setShowLoadOverlay(false);
        }
      })();
      return;
    }

    // 대체 경로: 기존 휴리스틱으로 로컬에서 타겟을 해석
    let resolved = null;
    for (const t of candidateTargets) {
      const p = resolveTargetToPos(indexMapRef, scriptLines, t);
      if (p !== null) {
        resolved = p;
        break;
      }
    }

    console.debug("Choice selected", {
      choiceIndex,
      rawChoice: choice,
      resolvedPos: resolved,
    });

    if (resolved !== null) {
      setPos(resolved);
      return;
    }

    goToNextSequential();
  };

  useEffect(() => {
    if (currentNode?.type === "choice") {
      // 타이핑 애니메이션을 멈추고 선택 오버레이를 엽니다
      setDisplayed("");
      setIsAnimating(false);
      setShowChoices(true);
    }
    // problem 노드 감지: 백엔드에서 문제와 공개 테스트를 가져와 CodeOverlay로 표시
    if (currentNode?.type === "problem") {
      (async () => {
        setDisplayed("");
        setIsAnimating(false);
        // fetch problem id from node (flexible keys)
        const pid =
          currentNode.problemId ??
          currentNode.problem?.id ??
          currentNode.codeProblem?.problemId ??
          currentNode.problem_id ??
          null;
        const problemKey =
          currentNode.problemKey ?? currentNode.problem?.key ?? null;
        try {
            if (pid) {
            const res = await fetch(`/problems/${pid}`, { cache: "no-store" });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || "fetch failed");
            setProblemData(json.data ?? null);
            // open CodeOverlay directly
            setShowCodeOverlay(true);
          } else if (problemKey) {
            // fallback: fetch problems for this story and find by key
            const res = await fetch(`/stories/${storyId}/problems`, { cache: "no-store" });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || "fetch failed");
            const arr = json.data || [];
            const found = arr.find(
              (p) =>
                p.key === problemKey || String(p.key) === String(problemKey)
            );
            if (found) {
              setProblemData(found);
              setShowCodeOverlay(true);
            } else {
              console.warn(
                "No problem found for key",
                problemKey,
                arr.map((a) => a.key)
              );
              setProblemData(null);
              setShowCodeOverlay(false);
            }
          } else {
            console.warn("Problem node without id or key", currentNode);
            setProblemData(null);
            setShowCodeOverlay(false);
          }
        } catch (e) {
          console.error("문제를 불러오는데 실패했습니다", e);
          setProblemData(null);
          setShowCodeOverlay(false);
        }
      })();
    } else {
      // node 변경이 problem이 아니면 overlay 닫기
      setShowCodeOverlay(false);
      setProblemData(null);
    }
  }, [currentNode, setDisplayed, setIsAnimating, storyId]);

  const choiceLabels = (node) => {
    if (!node?.choices) return [];
    return node.choices.map((c) =>
      typeof c === "string" ? c : c?.text ?? c?.label ?? ""
    );
  };

  //-------------------------------------------코드 제출에 사용
  const handleSubmitCode = () => {
    setShowCodeOverlay(false);
    const target =
      currentNode?.codeProblem?.onSubmitTargetIndex ??
      currentNode?.codeProblem?.targetIndex;
    const p = resolveTargetToPos(indexMapRef, scriptLines, target);
    if (p !== null) setPos(p);
    else goToNextSequential();
  };
  //-------------------------------------------loadSlot에 사용
  const handleLoadSlot = (slot) => {
    if (!slot) return;
    if (typeof slot.lineIndex === "number") setPos(slot.lineIndex);
    setShowLoadOverlay(false);
  };
  //--------------------------------------------지울거
  // visibleHeroines 계산 (헬퍼 사용)
  const visibleHeroines = computeVisibleHeroines(
    currentNode,
    storyHeroineCount
  );
  console.debug("visibleHeroines", {
    visibleHeroines,
    storyHeroineCount,
    nodeIndex: currentNode?.index,
  });

  // 디버그: 로드된 스크립트, pos, 현재 노드 확인용 로그
  console.debug("GameScreen debug", {
    storyId,
    scriptLinesLength: Array.isArray(scriptLines) ? scriptLines.length : null,
    scriptPreview: Array.isArray(scriptLines)
      ? scriptLines.slice(0, 8)
      : scriptLines,
    pos,
    currentNode,
  });

  //-----------------------------------------------지울거

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="relative w-full h-full bg-cover bg-center"
        style={{ backgroundImage: "url('background/class.png')" }}
      >
        <Menu
          onSave={() => {}}
          onLoad={() => setShowLoadOverlay(true)}
          onGoHome={onGoHome}
          onSetting={onSetting}
        />

        {/* 히로인 이미지 처리
            - 스토리가 3명 모드일 때: 발화자(현재 말하는 사람) 이미지만 표시
            - 그 외(단일 모드): 기본 중앙 히로인 이미지 표시 */}
        {(() => {
          const heroImgMap = {
            시현: "/heroine/c.png",
            유자빈: "/heroine/java.png",
            파인선: "/heroine/python.png",
          };

          // 세 명 모드: 좌/중/우 모두 보여주되, 발화자만 active
          if (visibleHeroines === "three") {
            const names = ["유자빈", "시현", "파인선"];
            return (
              <>
                {names.map((name, i) => (
                  <Heroine
                    key={name}
                    position={i === 0 ? "left" : i === 1 ? "center" : "right"}
                    img={heroImgMap[name] ?? "/heroine/c.png"}
                    active={
                      // If current node is narration, show all heroines as active (colored)
                      currentNode?.type === "narration"
                        ? true
                        : Boolean(activeSpeaker) &&
                          (activeSpeaker === name ||
                            (typeof activeSpeaker === "string" &&
                              activeSpeaker.includes(name)) ||
                            (typeof name === "string" &&
                              name.includes(activeSpeaker)))
                    }
                  />
                ))}
              </>
            );
          }

          // 단일 모드: 메인 히로인(중앙)
          const defaultImg = heroImgMap[activeSpeaker] ?? "/heroine/c.png";
          return <Heroine position="center" img={defaultImg} active={true} />;
        })()}

        <DialogueBox
          speaker={currentNode?.speaker}
          text={displayed}
          isAnimating={isAnimating}
          onAdvance={handleAdvance}
          onSkip={() => {
            setDisplayed(currentNode?.text ?? "");
            setIsAnimating(false);
          }}
        />

        {showChoices && (
          <ChoiceOverlay
            choices={choiceLabels(currentNode)}
            onChoice={handleChoice}
          />
        )}

        {/* Problem modal removed — we render problems inside existing CodeOverlay */}

        {showCodeOverlay && (
          <CodeOverlay
            // 우선순위: DB에서 받아온 problemData.content -> script의 inline codeProblem -> 빈 문자열
            title={problemData?.title}
            problem={
              problemData?.content ?? currentNode?.codeProblem?.text ?? ""
            }
            testcases={problemData?.testcases ?? []}
            code={userCode}
            onCodeChange={setUserCode}
            onSubmit={handleSubmitCode}
            onClose={() => setShowCodeOverlay(false)}
          />
        )}

        {showLoadOverlay && (
          <LoadOverlay
            slots={[]}
            onSelect={handleLoadSlot}
            onClose={() => setShowLoadOverlay(false)}
          />
        )}
      </div>
    </div>
  );
}
