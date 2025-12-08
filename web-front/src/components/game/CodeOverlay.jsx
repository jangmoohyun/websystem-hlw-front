import React, { useState } from "react";

export default function CodeOverlay({
  title,
  problem,
  testcases = [],
  code,
  onCodeChange,
  onSubmit,
  onClose,
  initialLanguageId,
}) {
  const [view, setView] = useState("problem");
  const [languageId, setLanguageId] = useState(initialLanguageId ?? 71);

  // Keep languageId in sync if parent provides a different default when opening
  React.useEffect(() => {
    if (initialLanguageId !== undefined && initialLanguageId !== null) {
      setLanguageId(initialLanguageId);
    }
  }, [initialLanguageId]);

  // 공개 테스트케이스를 문제 본문에  표시
  const combinedProblem = (() => {
    const base = problem ?? "";
    if (!testcases || testcases.length === 0) return base;
    const casesText = testcases
      .map((tc, idx) => {
        const inText = tc.input ?? tc.content ?? "";
        const outText = tc.expected ?? "";
        if (inText && outText)
          return `${idx + 1}. 입력: ${inText}  출력: ${outText} `;
        if (inText) return `${idx + 1}. ${inText}`;
        return `${idx + 1}. ${tc.content ?? tc.expected ?? ""}`;
      })
      .join("\n\n");
    return `${base}\n\n공개 테스트케이스:\n${casesText}`;
  })();

  return (
    <div
      className="absolute inset-0 bg-[rgba(0,0,0,0.45)] flex items-center justify-center z-20"
      onClick={(e) => {
        // 배경(오버레이 외곽) 클릭이 게임 레이어로 전파되어 대사 진행을 x
        e.stopPropagation();
        if (typeof onClose === "function") onClose();
      }}
    >
      <div
        className="
          w-[80%] h-[80%]
          bg-[rgba(255,255,255,0.7)]
          backdrop-blur-[6px]
          rounded-[18px]
          px-[24px] py-[20px]
          flex flex-col
        "
        onClick={(e) => e.stopPropagation()}
      >
        {view === "problem" ? (
          <>
            <h2 className="mt-[5px] mb-[8px] text-[28px]">
              {title ?? "코딩 문제"}
            </h2>
            <div
              className="
                flex-1
                p-[12px]
                rounded-[10px]
                text-[22px]
                bg-[rgba(255,255,255,0.3)]
                overflow-y-auto
                whitespace-pre-wrap
              "
            >
              {combinedProblem}
            </div>

            <div className="flex justify-between items-center gap-[10px] mt-[10px]">
              <div className="flex items-center gap-2"></div>
              <div className="flex">
                <button
                  className="
                  border-none rounded-[8px]
                  px-[16px] py-[10px]
                  text-[18px] cursor-pointer
                  bg-[rgba(250,173,250,0.9)]
                  transition
                  hover:-translate-y-[1px]
                "
                  onClick={() => setView("code")}
                >
                  코드 입력하기
                </button>
                <button
                  className="
                  border-none rounded-[8px]
                  px-[16px] py-[10px]
                  text-[18px] cursor-pointer
                  bg-[rgba(255,120,120,0.9)]
                  transition
                  hover:-translate-y-[1px]
                "
                  onClick={onClose}
                >
                  닫기
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-[5px] mb-[8px] text-[28px]">코드 입력</h2>
            <textarea
              className="
                flex-1 w-full
                rounded-[10px]
                p-[12px]
                text-[18px] font-mono
                bg-[rgba(0,0,0,0.7)]
                text-white
                resize-none outline-none overflow-y-auto
              "
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="// 여기에 코드를 작성하세요"
            />
            <div className="flex justify-end gap-[10px] mt-[10px]">
              <button
                className="
                  border-none rounded-[8px]
                  px-[16px] py-[10px]
                  text-[18px] cursor-pointer
                  bg-[rgba(250,173,250,0.9)]
                  transition
                  hover:-translate-y-[1px]
                "
                onClick={() => onSubmit && onSubmit({ code, languageId })}
              >
                제출하기
              </button>
              <button
                className="
                  border-none rounded-[8px]
                  px-[16px] py-[10px]
                  text-[18px] cursor-pointer
                  bg-[rgba(200,215,255,0.9)]
                  transition
                  hover:-translate-y-[1px]
                "
                onClick={() => setView("problem")}
              >
                문제로 돌아가기
              </button>
              <button
                className="
                  border-none rounded-[8px]
                  px-[16px] py-[10px]
                  text-[18px] cursor-pointer
                  bg-[rgba(255,120,120,0.9)]
                  transition
                  hover:-translate-y-[1px]
                "
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
