// src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";

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
  {
    speaker: "나",
    text: "그녀들이 각자 다른 방향으로 발걸음을 옮기려 한다. ",
  },
  {
    speaker: "나",
    text: "내 다음 수업은 뭐였더라...? ",
  },
];

function App() {
  const [lineIndex, setLineIndex] = useState(0); // 몇 번째 대사인지
  const [displayedText, setDisplayedText] = useState(""); // 화면에 찍히는 글자
  const [isAnimating, setIsAnimating] = useState(true); // 타자 효과 진행
  const [showChoices, setShowChoices] = useState(false); // 선택지 보이냐

  const currentLine = script[lineIndex];
  const fullText = currentLine.text;

  // 대사가 바뀔 때마다 타자 효과
  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      i += 1;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 30); // 글자 나오는 속도(ms)

    return () => clearInterval(interval);
  }, [fullText, setIsAnimating]);

  const startNewLine = (nextIndex) => {
    setLineIndex(nextIndex);
    setDisplayedText("");
    setIsAnimating(true);
  };

  const goToNextLine = () => {
    // 예시
    if (lineIndex === 4 && !showChoices) {
      setShowChoices(true);
      return;
    }

    if (lineIndex < script.length - 1) {
      startNewLine(lineIndex + 1);
    } else {
      console.log("대사 끝");
    }
  };

  const handleChoice = (choiceIndex) => {
    console.log("선택한 선택지:", choiceIndex);
    setShowChoices(false);

    // 선택에 따라 분기하고 싶으면 여기서 분기 가능

    //일단 스킵
    if (lineIndex < script.length - 1) {
      startNewLine(lineIndex + 1);
    }
  };

  // 마우스 클릭 / 스페이스바용
  const handleAdvance = () => {
    //선택지 떠있을 시
    if (showChoices) return;

    if (isAnimating) {
      // 애니메이션 중이면 대사 한 번에 다 보여주기
      setDisplayedText(fullText);
      setIsAnimating(false);
    } else {
      // 이미 다 나온 상태면 다음 대사로
      goToNextLine();
    }
  };

  // 스킵 버튼용
  const handleSkipClick = () => {
    if (showChoices) return;

    if (isAnimating) {
      setDisplayedText(fullText);
      setIsAnimating(false);
    } else {
      goToNextLine();
    }
  };

  // 스페이스바로 넘기기
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault(); // 페이지 스크롤 방지
        handleAdvance();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="game-root">
      {/* 배경 */}
      <div className="game-background">
        {/* 가운데 히로인(이미지 자리) */}
        <div className="heroine"></div>

        {/* 대화창 */}
        <div className="dialogue-box" onClick={handleAdvance}>
          <div className="dialogue-header">
            <span className="speaker-name">{currentLine.speaker}</span>
          </div>
          <div className="dialogue-text">
            {displayedText}
            {isAnimating && <span className="cursor">▌</span>}
          </div>
          <button
            type="button"
            className="skip-button"
            onClick={(e) => {
              e.stopPropagation(); // 클릭이 상위 onClick으로 안 올라가게
              handleSkipClick();
            }}
          >
            →
          </button>
        </div>
        {/* 선택지 오버레이(예시) */}
        {showChoices && (
          <div className="choice-overlay">
            <div className="choice-modal" onClick={(e) => e.stopPropagation()}>
              <button className="choice-button" onClick={() => handleChoice(0)}>
                1. 운영체제
              </button>
              <button className="choice-button" onClick={() => handleChoice(1)}>
                2. 분병컴
              </button>
              <button className="choice-button" onClick={() => handleChoice(2)}>
                3. 기계학습
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
