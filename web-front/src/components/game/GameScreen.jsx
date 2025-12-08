// src/components/game/GameScreen.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Heroine from "./Heroine";
import DialogueBox from "./DialogueBox";
import CodeOverlay from "./CodeOverlay";
import Menu from "./Menu";
import SaveMenu from "../common/SaveMenu";
import LoadOverlay from "../common/LoadOverlay";
import SubmittingOverlay from "../codeProblem/SubmittingOverlay";
import ResultOverlay from "../codeProblem/ResultOverlay";
import ChoiceOverlay from "./ChoiceOverlay";

import useStoryLoader from "./hooks/useStoryLoader";
import useTyping from "./hooks/useTyping";
import useChoiceHandler from "./hooks/useChoiceHandler";
import useProblemHandler from "./hooks/useProblemHandler";
import { computeVisibleHeroines } from "./utils/helpers";

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
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  // 스토리 메타 데이터(히로인/문제) & 히로인 등장 여부 ----------------------
  const [storyHeroines, setStoryHeroines] = useState([]);
  const [storyProblems, setStoryProblems] = useState([]);
  const [hasHeroineAppeared, setHasHeroineAppeared] = useState(false);
  // 일러스트 모드 상태: 스크립트 노드(type : illust)일 때
  const [illustrationActive, setIllustrationActive] = useState(false);
  const [illustrationImage, setIllustrationImage] = useState(null);
  const illustrationTimerRef = useRef(null);

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
    // Prefer normalized languageId from backend if present
    if (activeSpeaker && Array.isArray(storyHeroines)) {
      const found = storyHeroines.find((h) => h.name === activeSpeaker);
      if (found && typeof found.languageId === "number")
        return found.languageId;
    }
    if (Array.isArray(storyHeroines) && storyHeroines.length > 0) {
      const first = storyHeroines[0];
      if (first && typeof first.languageId === "number")
        return first.languageId;
    }
    // Fallback to Python
    return 71;
  }, [activeSpeaker, storyHeroines]);

  // 훅으로 분리한 선택/문제 처리는 goToNextSequential 선언 후에 호출.

  // 대사 라인 이동 -------------------------------------------
  // 순차 진행 : 다음 라인으로 이동
  const goToNextSequential = useCallback(() => {
    if (!Array.isArray(scriptLines) || scriptLines.length === 0) return;
    setPos((prev) => {
      const last = scriptLines.length - 1;
      let next = Math.min(prev + 1, last);

      // 건너뛰어야 할 노드가 있을 시 meta.condition이 있는 노드는 자동으로 건너뛰도록 함
      while (next <= last) {
        const node = scriptLines[next];
        if (!node) break;
        const rawMeta = node.meta;
        const meta = Array.isArray(rawMeta) ? rawMeta[0] : rawMeta || {};
        if (meta && meta.condition) {
          // 조건부 대사 노드는 건너뛰기
          next = Math.min(next + 1, last);
          // 만약 이미 마지막이면 멈춤
          if (next === last) break;
          continue;
        }
        break;
      }

      return next;
    });
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
    resultData,
    setResultData,
    pendingNextPos,
    setPendingNextPos,
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
    // 일러스트 노드 처리: type이 'illust'인 경우
    const nodeType = (currentNode.type || "").toString().toLowerCase();
    const isIllustration = nodeType === "illust";

    if (isIllustration) {
      // 이미지 경로와 지속시간 설정
      const rawMeta = currentNode.meta;
      const meta = Array.isArray(rawMeta) ? rawMeta[0] : rawMeta || {};

      const img = meta.image || null;
      const durRaw = meta.duration || 0;
      const durationSec = Number(durRaw);
      // duration이 0 또는 없는 경우 기본 대기시간을 사용(초)
      const effectiveDuration =
        Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 3;
      console.log(img);
      // 기존 타이머 정리
      if (illustrationTimerRef.current) {
        clearTimeout(illustrationTimerRef.current);
        illustrationTimerRef.current = null;
      }

      setIllustrationImage(img ?? null);
      setIllustrationActive(true);

      // 항상 타이머를 설정해서 일정 시간 동안 유지하도록 함
      illustrationTimerRef.current = setTimeout(() => {
        // 일러스트 시간이 끝나면 자동으로 다음 장면으로 이동
        try {
          goToNextSequential();
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          /* empty */
        }
        setIllustrationActive(false);
        setIllustrationImage(null);
        illustrationTimerRef.current = null;
      }, effectiveDuration * 1000);

      // 일러스트 모드에서는 히로인 등장은 숨김
      setHasHeroineAppeared(false);
      return; // 일러스트 노드의 경우 아래 기존 로직을 무시
    }

    // storyHeroines를 통해 해당 스토리에 연결된 히로인 이름 목록 생성
    const knownNames =
      Array.isArray(storyHeroines) && storyHeroines.length > 0
        ? storyHeroines.map((h) => h.name)
        : FALLBACK_HEROINE_ORDER;

    //대사 라인에서 speaker가 누구인지(이를 통해 해당 히로인 이미지 표시)
    if (
      typeof currentNode.speaker === "string" &&
      knownNames.includes(currentNode.speaker)
    ) {
      setHasHeroineAppeared(true);
      return;
    }
  }, [currentNode, goToNextSequential, storyHeroines]);

  // choice/problem 진입 처리는 훅(`useChoiceHandler`, `useProblemHandler`)으로 분리되었습니다.

  //\대사 진행(클릭/스페이스) ---------------------------------------

  const handleAdvance = useCallback(() => {
    if (!currentNode) return;
    // 일러스트 활성 시에는 진행을 막음 (일정 시간 지난 후 자동 해제)
    if (illustrationActive) return;
    if (resultData) {
      return;
    }

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

    // 다른 이유로 진행이 막혀 있으면 알림 (문제 노드 여부는 위에서 이미 처리)
    if (!canAdvance) {
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
    resultData,
    illustrationActive,
  ]);

  // 컴포넌트 언마운트 시 일러스트 타이머 정리
  useEffect(() => {
    return () => {
      if (illustrationTimerRef.current) {
        clearTimeout(illustrationTimerRef.current);
        illustrationTimerRef.current = null;
      }
    };
  }, []);

  //세이브 슬롯 로드 -----------------------------------------------

  const handleLoadSlot = useCallback((slot) => {
    if (!slot) return;
    if (typeof slot.lineIndex === "number") setPos(slot.lineIndex);
    setShowLoadOverlay(false);
  }, []);

  //히로인 렌더링 -----------------------------------------------

  const renderHeroines = () => {
    // 일러스트가 활성화되어 있으면 히로인 그림은 숨깁니다.
    if (illustrationActive) return null;
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

    // 단일 모드
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
  const backgroundStyle = (() => {
    if (illustrationActive && illustrationImage) {
      return {
        backgroundImage: `url('${illustrationImage}')`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "#000",
      };
    }

    return {
      backgroundImage: "url('background/class.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  })();

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="relative w-full h-full bg-cover bg-center"
        style={backgroundStyle}
      >
        {/* 메뉴 */}
        <Menu
          onSave={() => setShowSaveMenu(true)}
          onLoad={() => setShowSaveMenu(true)}
          onGoHome={onGoHome}
          onSetting={onSetting}
        />

        {/* 히로인 렌더링 (일러스트는 배경으로 처리되므로 항상 renderHeroines 호출) */}
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
            problem={problemData?.content ?? ""}
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

        {/* 로드 오버레이 (세이브/로드) 또는 제출 중 전용 오버레이 */}
        {showLoadOverlay && problemData ? (
          <SubmittingOverlay />
        ) : showLoadOverlay ? (
          <LoadOverlay
            slots={[]}
            onSelect={handleLoadSlot}
            onClose={() => setShowLoadOverlay(false)}
          />
        ) : null}

        {/* 슬롯 기반 저장/불러오기 메뉴 모달 */}
        {showSaveMenu && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white p-4 rounded">
              <button className="mb-2" onClick={() => setShowSaveMenu(false)}>
                닫기
              </button>
              <SaveMenu
                storyId={storyId}
                lineIndex={pos}
                heroineLikes={[]}
                onLoad={(saveData) => {
                  // SaveMenu에서 불러오기를 하면 게임 상태에 반영
                  if (saveData && typeof saveData.lineIndex === "number") {
                    setPos(saveData.lineIndex);
                  }
                  setShowSaveMenu(false);
                }}
              />
            </div>
          </div>
        )}

        {/* 제출 결과 오버레이 */}
        {resultData && (
          <ResultOverlay
            result={resultData}
            onClose={() => {
              // 제출 결과를 닫을 때 잠시 보류된 네비게이션을 적용
              if (pendingNextPos !== null) {
                if (pendingNextPos === "sequential") {
                  goToNextSequential();
                } else {
                  setPos(pendingNextPos);
                }
                setPendingNextPos(null);
              }
              setResultData(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
