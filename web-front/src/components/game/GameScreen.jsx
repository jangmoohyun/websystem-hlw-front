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
  const [storyId, setStoryId] = useState(4);

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
  // 코드 오버레이를 닫을 때 동일한 클릭으로 대사가 바로 넘어가는 것을 방지합니다.
  // 닫기 클릭 후 발생하는 자동 진행을 일시적으로 억제합니다.
  const [suppressAdvance, setSuppressAdvance] = useState(false);
  const [userCode, setUserCode] = useState("");
  // whether advancing (space/click) is allowed; problem nodes set this to false
  // until the user submits successfully
  const [canAdvance, setCanAdvance] = useState(true);
  // 제출해야만 다음으로 진행할 수 있는 문제 노드의 인덱스
  const [requiredProblemNodeIndex, setRequiredProblemNodeIndex] =
    useState(null);
  // problem node 상태
  const [problemData, setProblemData] = useState(null);
  // 현재 스토리에 연결된 히로인 목록
  const [storyHeroines, setStoryHeroines] = useState([]);
  // 히로인이 이미 등장(발화)했는지 여부 - 처음에는 숨김
  const [hasHeroineAppeared, setHasHeroineAppeared] = useState(false);
  // 현재 스토리에 연결된 문제 목록 (GET /stories/:id 에 포함되어 내려옴)
  const [storyProblems, setStoryProblems] = useState([]);

  // 현재 노드: pos는 scriptLines(전체 노드 배열)의 인덱스를 가리키도록 통일
  // 대사만을 대상으로 하는 이동은 findNextDialoguePos 헬퍼를 사용하여 처리
  const currentNode = Array.isArray(scriptLines)
    ? scriptLines[pos] ?? null
    : null;
  const activeSpeaker = currentNode?.speaker ?? null;

  // 히로인이 대사로 등장했는지 감지
  useEffect(() => {
    // reset when story changes
    setHasHeroineAppeared(false);
  }, [storyId]);

  useEffect(() => {
    if (!currentNode) return;
    const knownNames =
      Array.isArray(storyHeroines) && storyHeroines.length > 0
        ? storyHeroines.map((h) => h.name)
        : ["시현", "유자빈", "파인선"];

    // 현재 노드의 발화자 또는 대화(dialogues)에 히로인 이름이 있으면 등장으로 간주
    if (
      typeof currentNode.speaker === "string" &&
      knownNames.includes(currentNode.speaker)
    ) {
      setHasHeroineAppeared(true);
      return;
    }

    if (Array.isArray(currentNode.dialogues)) {
      for (const d of currentNode.dialogues) {
        if (d?.speaker && knownNames.includes(d.speaker)) {
          setHasHeroineAppeared(true);
          return;
        }
      }
    }
  }, [currentNode, storyHeroines]);

  // 헬퍼: `scriptLines`에서 다음 대사(또는 `speaker`가 있는 노드) 위치를 찾습니다
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

  // 스토리 정보(히로인 포함)를 가져와 storyHeroines 상태에 저장
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/stories/${storyId}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "fetch failed");
        setStoryHeroines(json.data?.heroines ?? []);
        setStoryProblems(json.data?.problems ?? []);
      } catch (e) {
        console.warn("Failed to load story heroines", e);
        setStoryHeroines([]);
      }
    })();
  }, [storyId]);

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
    console.debug("handleAdvance called", {
      pos,
      nodeType: currentNode?.type,
      canAdvance,
      requiredProblemNodeIndex,
      suppressAdvance,
    });

    // 최근에 오버레이를 닫아서 발생한 진행(같은 클릭의 후속 이벤트)이면 이를 소비하고 아무 동작도 하지 않습니다.
    if (suppressAdvance) {
      setSuppressAdvance(false);
      return;
    }

    // 문제 노드가 제출을 요구하는 경우 진행을 차단합니다.
    // `canAdvance`와 `requiredProblemNodeIndex` 둘 다 검사하여
    // 실수로 `canAdvance`가 다시 활성화되어도 건너뛰지 않도록 합니다.
    if (
      !canAdvance ||
      (requiredProblemNodeIndex !== null &&
        Number(pos) === Number(requiredProblemNodeIndex))
    ) {
      alert("문제를 제출해야 다음으로 진행할 수 있습니다.");
      return;
    }

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
              // 개발 시 테스트로 지워야할거
              userId: 1,
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
        // fetch problem id from node (flexible keys, include meta field)
        const pid =
          currentNode.problemId ??
          currentNode.problem?.id ??
          currentNode.codeProblem?.problemId ??
          currentNode.problem_id ??
          currentNode.meta?.problemId ??
          null;
        const problemKey =
          currentNode.problemKey ??
          currentNode.problem?.key ??
          currentNode.meta?.problemKey ??
          null;
        try {
          const arr = storyProblems || [];
          if (pid) {
            const foundById = arr.find((p) => String(p.id) === String(pid));
            const foundByKey = arr.find((p) => String(p.key) === String(pid));
            const found = foundById || foundByKey || null;
            if (found) {
              setProblemData(found);
              setShowCodeOverlay(true);
              // Use the numeric array index `pos` to mark this node as requiring submission
              setRequiredProblemNodeIndex(pos);
              // entering a problem node: disallow advancing until submission
              setCanAdvance(false);
            } else {
              console.warn(
                "No problem found for id/key",
                pid,
                arr.map((a) => a.id)
              );
              setProblemData(null);
              setShowCodeOverlay(false);
            }
          } else if (problemKey) {
            const found = arr.find(
              (p) =>
                p.key === problemKey || String(p.key) === String(problemKey)
            );
            if (found) {
              setProblemData(found);
              setShowCodeOverlay(true);
              // Use the numeric array index `pos` to mark this node as requiring submission
              setRequiredProblemNodeIndex(pos);
              // entering a problem node: disallow advancing until submission
              setCanAdvance(false);
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
      // 현재 노드가 problem이 아니면 오버레이를 닫고 진행을 허용합니다
      setShowCodeOverlay(false);
      setProblemData(null);
      setCanAdvance(true);
    }
  }, [currentNode, setDisplayed, setIsAnimating, storyId, storyProblems]);

  const choiceLabels = (node) => {
    if (!node?.choices) return [];
    return node.choices.map((c) =>
      typeof c === "string" ? c : c?.text ?? c?.label ?? ""
    );
  };

  //-------------------------------------------코드 제출에 사용
  // handleSubmitCode는 CodeOverlay로부터 선택적으로 오버라이드 { code, languageId }
  // 를 받을 수 있습니다. 사용자가 언어를 명시적으로 선택했을 때 이를 우선 사용합니다.
  const handleSubmitCode = async (override = {}) => {
    // submit code to backend, wait for judge0 results, then advance
    if (!currentNode) return;
    setShowLoadOverlay(true);
    try {
      // HEROINE -> Judge0 language_id 매핑 (확인된 값)
      const HEROINE_LANGUAGE_MAP = {
        시현: 50, // C (GCC 9.2.0)
        파인선: 71, // Python (3.8.1)
        유자빈: 91, // Java (JDK 17.0.6)
      };

      // 스토리의 히로인 목록에서 우선순위로 선택
      let chosenHeroineName = null;
      if (
        activeSpeaker &&
        storyHeroines.some((h) => h.name === activeSpeaker)
      ) {
        chosenHeroineName = activeSpeaker;
      } else if (storyHeroines.length > 0) {
        chosenHeroineName = storyHeroines[0].name;
      }

      const mappedLangId = chosenHeroineName
        ? HEROINE_LANGUAGE_MAP[chosenHeroineName] ??
          HEROINE_LANGUAGE_MAP["파인선"]
        : HEROINE_LANGUAGE_MAP["파인선"];

      // CodeOverlay에서 명시적으로 전달된 languageId가 있으면 이를 우선 사용합니다(사용자 오버라이드).
      const finalLangId = override.languageId ?? mappedLangId;

      // 플랫폼별 CRLF 문제를 방지하기 위해 줄바꿈을 LF로 정규화합니다
      const normalizedSource = (override.code ?? userCode ?? "").replace(
        /\r\n/g,
        "\n"
      );

      const payload = {
        // 개발 시 테스트로 지워야할거
        userId: 1,
        // send the actual array position for clarity/consistency
        nodeIndex: pos,
        choiceId: currentNode?.choiceId ?? null,
        problemId: problemData?.id ?? currentNode?.problemId ?? null,
        sourceCode: normalizedSource,
        languageId: finalLangId,
      };
      console.debug("Submitting problem payload", payload);

      const res = await fetch(`/problems/${storyId}/submit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "submission failed");

      const { passed, testResults, appliedAffinities } = json;
      // summarize
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

      // show brief summary to user and full details in console
      alert(msg);
      console.log("submission result", json);
      // clear requirement (submission done) before advancing
      setRequiredProblemNodeIndex(null);
      // allow advancing after successful submission
      setCanAdvance(true);
      // advance to onSubmit target (same as previous behavior)
      const target =
        currentNode?.codeProblem?.onSubmitTargetIndex ??
        currentNode?.codeProblem?.targetIndex;
      const p = resolveTargetToPos(indexMapRef, scriptLines, target);
      if (p !== null) setPos(p);
      else goToNextSequential();
      setShowCodeOverlay(false);
    } catch (e) {
      console.error(e);
      alert("제출 중 오류가 발생했습니다: " + (e.message || e));
      // do not advance on error; user must submit successfully to proceed
    } finally {
      setShowLoadOverlay(false);
    }
  };
  //-------------------------------------------loadSlot에 사용
  const handleLoadSlot = (slot) => {
    if (!slot) return;
    if (typeof slot.lineIndex === "number") setPos(slot.lineIndex);
    setShowLoadOverlay(false);
  };
  //--------------------------------------------지울거
  // visibleHeroines 계산 (헬퍼 사용)
  // Use DB-provided storyHeroines count (prefer authoritative association)
  // fallback: use script-detected `storyHeroineCount` if storyHeroines not loaded yet
  const effectiveHeroineCount =
    Array.isArray(storyHeroines) && storyHeroines.length > 0
      ? storyHeroines.length
      : storyHeroineCount;

  const visibleHeroines = computeVisibleHeroines(
    currentNode,
    effectiveHeroineCount
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

  // 스토리의 히로인 정보를 바탕으로 오버레이의 기본 언어 ID를 결정합니다.
  // 우선 heroine.language 값을 사용하고, 없으면 이름 기반 매핑으로 대체합니다.
  const computeOverlayDefaultLangId = () => {
    const HEROINE_LANGUAGE_MAP = {
      시현: 50, // C
      파인선: 71, // Python
      유자빈: 91, // Java
    };

    // 발화자가 히로인일 경우 그 히로인을 선택하고, 아니면 스토리의 첫번째 히로인을 선택합니다
    let chosen = null;
    if (activeSpeaker && storyHeroines.some((h) => h.name === activeSpeaker)) {
      chosen = storyHeroines.find((h) => h.name === activeSpeaker);
    } else if (Array.isArray(storyHeroines) && storyHeroines.length > 0) {
      chosen = storyHeroines[0];
    }

    if (!chosen) return 71; // default Python

    // 히로인에 `language` 필드가 있으면 이를 정규화하여 매핑합니다
    const langField = (chosen.language || "").toString().toLowerCase();
    if (langField) {
      if (langField.includes("python")) return 71;
      if (langField.includes("java")) return 91;
      if (langField === "c" || langField.includes("c")) return 50;
    }

    // 이름 기반 매핑으로 대체합니다
    return HEROINE_LANGUAGE_MAP[chosen.name] ?? 71;
  };
  const overlayDefaultLangId = computeOverlayDefaultLangId();

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
          if (!hasHeroineAppeared) return null;
          const heroImgMap = {
            시현: "/heroine/c.png",
            유자빈: "/heroine/java.png",
            파인선: "/heroine/python.png",
          };

          // 세 명 모드: 좌/중/우 모두 보여주되, 발화자만 active
          if (visibleHeroines === "three") {
            // Use story-provided heroine order when available; otherwise fall back to known order
            const names =
              Array.isArray(storyHeroines) && storyHeroines.length >= 3
                ? storyHeroines.map((h) => h.name)
                : ["유자빈", "시현", "파인선"];
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
          // 우선순위: 스토리 연관 히로인(`storyHeroines[0]`) -> 현재 발화자(activeSpeaker) -> 기본 이미지
          let mainHeroName = null;
          if (Array.isArray(storyHeroines) && storyHeroines.length > 0) {
            mainHeroName = storyHeroines[0].name;
          } else if (activeSpeaker) {
            mainHeroName = activeSpeaker;
          }
          const defaultImg =
            heroImgMap[mainHeroName] ??
            heroImgMap[activeSpeaker] ??
            "/heroine/c.png";
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
            initialLanguageId={overlayDefaultLangId}
            onClose={() => {
              // don't advance when user explicitly closes the overlay
              // Use a named handler to log state for debugging
              console.debug("CodeOverlay onClose invoked", {
                pos,
                canAdvanceBefore: canAdvance,
                requiredProblemNodeIndex,
              });
              setShowCodeOverlay(false);
              setSuppressAdvance(true);
              // keep advancement blocked when overlay is closed without submission
              setCanAdvance(false);
              console.debug("CodeOverlay onClose applied", {
                canAdvanceAfter: false,
                suppressAdvanceAfter: true,
              });
            }}
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
