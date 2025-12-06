// src/components/game/GameScreen.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

//상수 정의 -----------------------------------------------------------------

//히로인 별 코드언어 ID 매핑
const HEROINE_LANGUAGE_MAP = {
  이시현: 50, // C
  파인선: 71, // Python
  유자빈: 91, // Java
};

//히로인 별 이미지 매핑  - 나중에 DB로 빼야함.
const HEROINE_IMAGE_MAP = {
  이시현: "/heroine/c.png",
  유자빈: "/heroine/java.png",
  파인선: "/heroine/python.png",
};

//3명일 때 기본 순서 (fallback)
const FALLBACK_HEROINE_ORDER = ["이시현", "유자빈", "파인선"];

// 컴포넌트 시작 & 기본 스토리 상태 -----------------------------------------

export default function GameScreen({ onGoHome, onSetting }) {
  // 현재 플레이 중인 스토리 ID
  const [storyId, setStoryId] = useState(1); //시작은 1

  // 스토리/스크립트 로딩
  const {
    scriptLines,
    indexMapRef,
    heroineCount: scriptHeroineCount,
  } = useStoryLoader(storyId);

  // 현재 노드 위치 (scriptLines에서 배열 인덱스)
  const [pos, setPos] = useState(0);

  // 현재 노드 (없으면 null)
  const currentNode = useMemo(
    () =>
      Array.isArray(scriptLines) && scriptLines.length > 0
        ? scriptLines[pos] ?? null
        : null,
    [scriptLines, pos]
  );
  const activeSpeaker = currentNode?.speaker ?? null;

  // UI 오버레이 / 진행 제어 상태 -------------------------------------------

  const [showChoices, setShowChoices] = useState(false); // 선택지창 오버레이
  const [showCodeOverlay, setShowCodeOverlay] = useState(false); // 코드 문제 오버레이
  const [showLoadOverlay, setShowLoadOverlay] = useState(false); // 로딩창 오버레이

  //CodeOverlay 닫은 직후 클릭 한 번 억제용
  const [suppressAdvance, setSuppressAdvance] = useState(false);

  //코드 제출 및 채점
  const [userCode, setUserCode] = useState(""); // 사용자 코드 입력내용
  const [canAdvance, setCanAdvance] = useState(true); // 문제 제출 후 진행 허용 여부
  const [requiredProblemNodeIndex, setRequiredProblemNodeIndex] =
    useState(null); // 강제 문제 제출 노드 인덱스

  // 스토리 메타 데이터(히로인/문제) & 히로인 등장 여부 ----------------------
  const [storyHeroines, setStoryHeroines] = useState([]);
  const [storyProblems, setStoryProblems] = useState([]);
  const [hasHeroineAppeared, setHasHeroineAppeared] = useState(false);

  // problem 노드에서 사용할 현재 문제 데이터
  const [problemData, setProblemData] = useState(null);

  // 대사 타이핑 효과 --------------------------------------------------------
  const { displayed, isAnimating, setDisplayed, setIsAnimating } = useTyping(
    currentNode?.text ?? "",
    25
  );

  // 유틸 값----------------------------------------------------

  // 히로인 수: DB값 우선, 없으면 스크립트 추정값
  const effectiveHeroineCount = useMemo(() => {
    if (Array.isArray(storyHeroines) && storyHeroines.length > 0) {
      return storyHeroines.length;
    }
    return scriptHeroineCount;
  }, [storyHeroines, scriptHeroineCount]); // storyHeroines에서 히로인 수 체크

  // 장면에서 히로인 3명인지 1명인지
  const visibleHeroines = useMemo(
    () => computeVisibleHeroines(currentNode, effectiveHeroineCount),
    [currentNode, effectiveHeroineCount]
  );

  // 코드 제출용 언어 ID (시현 = C, 파인선 = Python, 유자빈 = Java)
  const overlayDefaultLangId = useMemo(() => {
    let chosenHeroine =
      (activeSpeaker && storyHeroines.find((h) => h.name === activeSpeaker)) ||
      storyHeroines[0];

    if (!chosenHeroine) return 71; // 기본 Python - 사용할 일 없음

    const langField = (chosenHeroine.language || "")
      .toString()
      .toLowerCase()
      .trim();

    if (langField) {
      if (langField.includes("python")) return 71;
      if (langField.includes("java")) return 91;
      if (langField === "c" || langField.includes("c")) return 50;
    }

    return HEROINE_LANGUAGE_MAP[chosenHeroine.name] ?? 71;
  }, [activeSpeaker, storyHeroines]);

  // 대사 라인 이동 -------------------------------------------

  // 스크립트 내에서 다음 대사/내레이션/선택/문제 노드 인덱스 찾기
  const findNextDialoguePos = useCallback(
    (fromIndex) => {
      if (!Array.isArray(scriptLines)) return null;

      const start =
        typeof fromIndex === "number" ? Math.max(0, fromIndex + 1) : 0;

      for (let i = start; i < scriptLines.length; i++) {
        const node = scriptLines[i];
        if (!node) continue;

        if (
          node.type === "dialogue" ||
          node.type === "narration" ||
          node.type === "choice" ||
          node.type === "problem" ||
          node.speaker
        ) {
          return i;
        }
      }
      return null;
    },
    [scriptLines]
  );

  // 순차 진행 : 다음 라인으로 이동 (공통 사용)
  const goToNextSequential = useCallback(() => {
    if (!Array.isArray(scriptLines) || scriptLines.length === 0) return;

    const next = findNextDialoguePos(pos);
    if (next !== null) {
      setPos(next);
    } else {
      setPos((prev) => Math.min(prev + 1, scriptLines.length - 1));
    }
  }, [findNextDialoguePos, pos, scriptLines]);

  // 스토리(히로인/문제) 로드 -----------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchStoryMeta = async () => {
      try {
        const res = await fetch(`/stories/${storyId}`); //스토리 메타정보 요청
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "fetch failed");

        if (cancelled) return;
        setStoryHeroines(json.data?.heroines ?? []);
        setStoryProblems(json.data?.problems ?? []);
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        if (!cancelled) {
          setStoryHeroines([]);
          setStoryProblems([]);
        }
      }
    };

    fetchStoryMeta();
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  //스크립트 로드 시 첫 노드 위치 설정 -------------------------------

  useEffect(() => {
    if (!Array.isArray(scriptLines) || scriptLines.length === 0) return;

    const firstIndex = scriptLines.findIndex(
      (n) =>
        n &&
        (n.type === "dialogue" ||
          n.type === "narration" ||
          n.type === "choice" ||
          n.speaker)
    );

    if (firstIndex >= 0) setPos(firstIndex);
  }, [scriptLines]);

  // 스토리 변경 시 히로인 등장 상태 초기화 -------------------------
  useEffect(() => {
    setHasHeroineAppeared(false);
  }, [storyId]);

  //현재 노드에서 히로인 등장 감지 ----------------------------------

  useEffect(() => {
    if (!currentNode) return;

    // storyHeroines를 통해 해당 스토리에 연결된 히로인 이름 목록 생성
    const knownNames =
      Array.isArray(storyHeroines) && storyHeroines.length > 0
        ? storyHeroines.map((h) => h.name)
        : ["이시현", "유자빈", "파인선"];

    //대사 라인에서 speaker가 누구인지(이를 통해 해당 히로인 이미지 표시)
    if (
      typeof currentNode.speaker === "string" &&
      knownNames.includes(currentNode.speaker)
    ) {
      setHasHeroineAppeared(true);
      return;
    }
  }, [currentNode, storyHeroines]);

  //choice / problem 노드 진입 처리 --------------------------------

  //choice 노드: 선택지 오버레이 표시
  useEffect(() => {
    if (!currentNode) return;

    if (currentNode.type === "choice") {
      // 선택지 노드 진입
      setDisplayed("");
      setIsAnimating(false); // 타이핑 효과 중지
      setShowChoices(true); // 선택지창 표시
    } else {
      setShowChoices(false);
    }
  }, [currentNode, setDisplayed, setIsAnimating]);

  // problem 아닐때
  useEffect(() => {
    if (!currentNode || currentNode.type !== "problem") {
      setShowCodeOverlay(false); // 코드 문제 창 숨김
      setProblemData(null); // 문제 데이터 초기화
      setCanAdvance(true); // 진행 허용
      setRequiredProblemNodeIndex(null);
      return;
    }

    //problem 노드: 문제 데이터 로딩 + 코드 문제 창 표시
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
        // eslint-disable-next-line no-unused-vars
        setCanAdvance(true);
        setRequiredProblemNodeIndex(null);
      }
    })();
  }, [currentNode, pos, setDisplayed, setIsAnimating, storyProblems]);

  //\대사 진행(클릭/스페이스) ---------------------------------------

  const handleAdvance = useCallback(() => {
    if (!currentNode) return;

    // CodeOverlay 닫은 직후 클릭 1회 무시(버그 방지용 다음 대사로 넘어가는거 막기)
    if (suppressAdvance) {
      setSuppressAdvance(false);
      return;
    }

    // 문제 노드 제출 필수임
    const isProblemBlocked =
      currentNode.type === "problem" &&
      (!canAdvance ||
        (requiredProblemNodeIndex !== null &&
          Number(pos) === Number(requiredProblemNodeIndex)));

    //아직 제출 안 했을 시
    if (isProblemBlocked) {
      // 코드창이 꺼져 있으면 다시 띄워주기
      if (!showCodeOverlay) {
        setShowCodeOverlay(true);
      } else {
        alert("문제를 제출해야 다음으로 진행할 수 있습니다.");
      }
      return;
    }

    // 혹시 다른 이유로 canAdvance가 막혀 있을 때도 대비
    if (
      !canAdvance ||
      (requiredProblemNodeIndex !== null &&
        Number(pos) === Number(requiredProblemNodeIndex))
    ) {
      alert("문제를 제출해야 다음으로 진행할 수 있습니다.");
      return;
    }

    // choice 상태면 선택지만 열고 진행 X
    if (currentNode.type === "choice") {
      setShowChoices(true);
      return;
    }

    // 스페이스바/클릭(스킵 시) 전체 문장 즉시 출력
    if (isAnimating) {
      setDisplayed(currentNode.text ?? "");
      setIsAnimating(false);
      return;
    }

    // 그 외에는 순차 진행
    goToNextSequential();
  }, [
    canAdvance,
    currentNode,
    goToNextSequential,
    isAnimating,
    pos,
    requiredProblemNodeIndex,
    setDisplayed,
    setIsAnimating,
    suppressAdvance,
    showCodeOverlay,
    setShowCodeOverlay,
    setSuppressAdvance,
    setShowChoices,
  ]);
  //선택지 라벨 / 선택 처리 ----------------------------------------

  const choiceLabels = useCallback((node) => {
    if (!node?.choices) return [];
    return node.choices.map((c) => c?.text ?? "");
  }, []); // 선택지 라벨 추출

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

      // 서버에 선택 결과 전달 (호감도/분기/다른 스토리 이동)
      if (needsServer) {
        (async () => {
          setShowLoadOverlay(true);
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
              action, // "branch" | "navigate"
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
          } finally {
            setShowLoadOverlay(false); // 선택지 창 닫기
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
    [currentNode, goToNextSequential, indexMapRef, scriptLines, storyId]
  );

  //코드 제출 -------------------------------------------------------

  const handleSubmitCode = useCallback(
    async (override = {}) => {
      if (!currentNode) return;

      setShowLoadOverlay(true);
      try {
        // 히로인 기반 언어 선택
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

        const finalLangId = override.languageId ?? mappedLangId;

        //15-2 코드 줄바꿈 정규화
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

        //제출 성공 후 진행 허용 + 강제 index 해제
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
      activeSpeaker,
      currentNode,
      goToNextSequential,
      indexMapRef,
      pos,
      problemData?.id,
      scriptLines,
      storyHeroines,
      storyId,
      userCode,
    ]
  );

  //세이브 슬롯 로드 -----------------------------------------------

  const handleLoadSlot = useCallback((slot) => {
    if (!slot) return;
    if (typeof slot.lineIndex === "number") setPos(slot.lineIndex);
    setShowLoadOverlay(false);
  }, []);

  //히로인 렌더링 -----------------------------------------------

  const renderHeroines = () => {
    if (!hasHeroineAppeared) return null;

    //3인 모드
    if (visibleHeroines === "three") {
      const names =
        Array.isArray(storyHeroines) && storyHeroines.length >= 3
          ? storyHeroines.map((h) => h.name)
          : FALLBACK_HEROINE_ORDER;

      return (
        <>
          {names.map((name, i) => (
            <Heroine
              key={name}
              position={i === 0 ? "left" : i === 1 ? "center" : "right"}
              img={HEROINE_IMAGE_MAP[name] ?? "/heroine/c.png"}
              active={
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

    //17-2 단일 모드
    let mainHeroName = null;
    if (Array.isArray(storyHeroines) && storyHeroines.length > 0) {
      mainHeroName = storyHeroines[0].name;
    } else if (activeSpeaker) {
      mainHeroName = activeSpeaker;
    }

    const defaultImg =
      HEROINE_IMAGE_MAP[mainHeroName] ??
      HEROINE_IMAGE_MAP[activeSpeaker] ??
      "/heroine/c.png";

    return <Heroine position="center" img={defaultImg} active={true} />;
  };

  //렌더 --------------------------------------------------------------------

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="relative w-full h-full bg-cover bg-center"
        style={{ backgroundImage: "url('background/class.png')" }}
      >
        {/* 메뉴 */}
        <Menu
          onSave={() => {
            // TODO: 세이브 기능 구현
          }}
          onLoad={() => setShowLoadOverlay(true)}
          onGoHome={onGoHome}
          onSetting={onSetting}
        />

        {/* 히로인 */}
        {renderHeroines()}

        {/* 대화 박스 */}
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

        {/* 선택지 */}
        {showChoices && (
          <ChoiceOverlay
            choices={choiceLabels(currentNode)}
            onChoice={handleChoice}
          />
        )}

        {/* 코딩 문제 오버레이 */}
        {showCodeOverlay && (
          <CodeOverlay
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
              setShowCodeOverlay(false);
              setSuppressAdvance(true); // 닫는 클릭으로 대사 넘기기 방지
              setCanAdvance(false); // 제출 없이 진행 못하게 유지
            }}
          />
        )}

        {/* 로드 오버레이 */}
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
