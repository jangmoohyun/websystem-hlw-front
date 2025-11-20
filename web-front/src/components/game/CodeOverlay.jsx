// src/components/game/CodeOverlay.jsx
import { useState } from "react";

export default function CodeOverlay({
  problem,
  code,
  onCodeChange,
  onSubmit,
  onClose,
}) {
  // 'problem' = 문제 화면, 'code' = 코드 입력 화면
  const [view, setView] = useState("problem");

  return (
    <div className="code-overlay" onClick={onClose}>
      <div
        className="code-modal"
        onClick={(e) => e.stopPropagation()} // 안쪽 클릭은 닫기 막기
      >
        {view === "problem" ? (
          <>
            {/* 문제 화면 */}
            <h2 className="code-title">코딩 문제</h2>

            <div className="code-problem">
              <div>{problem}</div>
            </div>

            <div className="code-buttons">
              <button className="code-button" onClick={() => setView("code")}>
                코드 입력하기
              </button>
              <button className="code-button cancel" onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 코드 입력 화면 */}
            <h2 className="code-title">코드 입력</h2>

            <textarea
              className="code-input"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="// 여기에 코드를 작성하세요"
            />

            <div className="code-buttons">
              <button className="code-button" onClick={onSubmit}>
                제출하기
              </button>
              <button
                className="code-button secondary"
                onClick={() => setView("problem")}
              >
                문제로 돌아가기
              </button>
              <button className="code-button cancel" onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
