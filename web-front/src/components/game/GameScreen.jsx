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
import useChoiceHandler from "./hooks/useChoiceHandler";
import useProblemHandler from "./hooks/useProblemHandler";
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

  //CodeOverlay 닫은 직후 클릭 한 번 억제용
  const [suppressAdvance, setSuppressAdvance] = useState(false);
  const [showLoadOverlay, setShowLoadOverlay] = useState(false); // 로딩창 오버레이 (훅에 전달)

  // 스토리 메타 데이터(히로인/문제) & 히로인 등장 여부 ----------------------
  const [storyHeroines, setStoryHeroines] = useState([]);
  const [storyProblems, setStoryProblems] = useState([]);
  const [hasHeroineAppeared, setHasHeroineAppeared] = useState(false);

  // 대사 타이핑 효과 --------------------------------------------------------
  const { displayed, isAnimating, setDisplayed, setIsAnimating } = useTyping(
    currentNode?.text ?? "",
    25
  );

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

  // 훅으로 분리한 선택/문제 처리는 goToNextSequential 선언 후에 호출합니다.

  // 대사 라인 이동 -------------------------------------------
  // 순차 진행 : 다음 라인으로 이동
  const goToNextSequential = useCallback(() => {
    if (!Array.isArray(scriptLines) || scriptLines.length === 0) return;
    setPos((prev) => Math.min(prev + 1, scriptLines.length - 1));
  }, [scriptLines]);

  // 훅으로 분리한 선택/문제 처리 (goToNextSequential 선언 후 호출)
  const {
    showCodeOverlay,
    setShowCodeOverlay,
    problemData,
    userCode,
    setUserCode,
    handleSubmitCode,
    canAdvance,
    setCanAdvance,
    requiredProblemNodeIndex,
  } = useProblemHandler({
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
  });

  const { showChoices, setShowChoices, choiceLabels, handleChoice } =
    useChoiceHandler({
      currentNode,
      indexMapRef,
      scriptLines,
      storyId,
      setPos,
      setStoryId,
      goToNextSequential,
      setShowLoadOverlay,
    });

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

  // choice/problem 진입 처리는 훅(`useChoiceHandler`, `useProblemHandler`)으로 분리되었습니다.

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
