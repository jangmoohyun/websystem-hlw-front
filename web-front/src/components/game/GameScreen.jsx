// src/components/game/GameScreen.jsx
import { useEffect, useState } from "react";
import "../../css/GameScreen.css";
import Heroine from "./Heroine";
import DialogueBox from "./DialogueBox";
import ChoiceOverlay from "./ChoiceOverlay";
import CodeOverlay from "./CodeOverlay";
import Menu from "./Menu";

const script = [
  {
    speaker: "시현",
    text: "아, 다음 나 운영체제수업이지. 휴강 안 했겠지? 귀찮게.",
  },
  {
    speaker: "유자빈",
    text: "저는 다음 강의가 분병컴(분산 병렬 컴퓨팅)이에요. 벌써부터 기대되네요!",
  },
  {
    speaker: "파인선",
    text: "제... 저는 기계학습(Machine Learning) 수업 들으러 가야 해요.",
  },
  { speaker: "나", text: "그녀들이 각자 다른 방향으로 발걸음을 옮기려 한다." },
  { speaker: "나", text: "내 다음 수업은 뭐였더라...?" },
];

function App() {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isAnimating, setIsAnimating] = useState(true);

  const [showChoices, setShowChoices] = useState(false);

  const [showCodeOverlay, setShowCodeOverlay] = useState(false);
  const [userCode, setUserCode] = useState("");

  const problemText = `
다음 문장을 수행하는 코드를 작성하세요:
지민이는 N개의 원소를 포함하고 있는 양방향 순환 큐를 가지고 있다. 지민이는 이 큐에서 몇 개의 원소를 뽑아내려고 한다.
지민이는 이 큐에서 다음과 같은 3가지 연산을 수행할 수 있다.
  1. 첫 번째 원소를 뽑아낸다. 이 연산을 수행하면, 원래 큐의 원소가 a1, ..., ak이었던 것이 a2, ..., ak와 같이 된다.
  2. 왼쪽으로 한 칸 이동시킨다. 이 연산을 수행하면, a1, ..., ak가 a2, ..., ak, a1이 된다.
  3. 오른쪽으로 한 칸 이동시킨다. 이 연산을 수행하면, a1, ..., ak가 ak, a1, ..., ak-1이 된다.
큐에 처음에 포함되어 있던 수 N이 주어진다. 그리고 지민이가 뽑아내려고 하는 원소의 위치가 주어진다. 
(이 위치는 가장 처음 큐에서의 위치이다.) 이때, 그 원소를 주어진 순서대로 뽑아내는데 드는 2번, 3번 연산의 최솟값을 출력하는 프로그램을 작성하시오.
(입력)
첫째 줄에 큐의 크기 N과 뽑아내려고 하는 수의 개수 M이 주어진다. N은 50보다 작거나 같은 자연수이고, M은 N보다 작거나 같은 자연수이다. 
둘째 줄에는 지민이가 뽑아내려고 하는 수의 위치가 순서대로 주어진다. 위치는 1보다 크거나 같고, N보다 작거나 같은 자연수이다.
  `;

  const currentLine = script[lineIndex];
  const fullText = currentLine.text;

  // 타자 효과
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [fullText]);

  const startNewLine = (nextIndex) => {
    setLineIndex(nextIndex);
    setDisplayedText("");
    setIsAnimating(true);
  };

  //  선택지 + 코드 오버레이 + 일반 진행을 모두 이 함수에서 처리
  const goToNextLine = () => {
    // 조건 1 : 특정 대사 후 선택지 켜기
    if (lineIndex === 4 && !showChoices) {
      setShowChoices(true);
      return;
    }

    // 조건 2 : 특정 대사 후 코드 입력창 켜기
    if (lineIndex === 2 && !showCodeOverlay) {
      setShowCodeOverlay(true);
      return;
    }

    // 기본 진행
    if (lineIndex < script.length - 1) {
      startNewLine(lineIndex + 1);
    } else {
      console.log("대사 끝!");
    }
  };

  const handleChoice = (choiceIndex) => {
    console.log("선택한 선택지:", choiceIndex);
    setShowChoices(false);
    goToNextLine(); // 선택 후 다음 대사 진행
  };

  const handleAdvance = () => {
    if (showChoices || showCodeOverlay) return;

    if (isAnimating) {
      setDisplayedText(fullText);
      setIsAnimating(false);
    } else {
      goToNextLine();
    }
  };

  const handleSkipClick = () => {
    if (showChoices || showCodeOverlay) return;

    if (isAnimating) {
      setDisplayedText(fullText);
      setIsAnimating(false);
    } else {
      goToNextLine();
    }
  };

  const handleSubmitCode = () => {
    console.log("제출된 코드:", userCode);
    setShowCodeOverlay(false);
    goToNextLine(); // 제출 후 다음 대사
  };

  // 스페이스바 넘기기
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === "TEXTAREA") {
        return; // ❗ return → preventDefault 실행 안 함
      }

      // 코드 입력창 열려 있으면 스페이스바로 대사 넘기기 막기
      if (showCodeOverlay) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="game-root">
      <div className="game-background">
        <Menu
          onSave={() => console.log("저장하기 클릭")}
          onLoad={() => console.log("불러오기 클릭")}
          onGoHome={() => console.log("홈으로 나가기 클릭")}
        />

        <Heroine />

        <DialogueBox
          speaker={currentLine.speaker}
          text={displayedText}
          isAnimating={isAnimating}
          onAdvance={handleAdvance}
          onSkip={handleSkipClick}
        />

        {showChoices && (
          <ChoiceOverlay
            choices={["운영체제", "분병컴", "기계학습"]}
            onChoice={handleChoice}
          />
        )}

        {showCodeOverlay && (
          <CodeOverlay
            problem={problemText}
            code={userCode}
            onCodeChange={setUserCode}
            onSubmit={handleSubmitCode}
            onClose={() => setShowCodeOverlay(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
