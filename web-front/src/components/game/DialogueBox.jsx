// src/components/game/DialogueBox.jsx
import React, { useEffect, useRef, useState } from "react";

export default function DialogueBox({
  speaker,
  text,
  isAnimating,
  onAdvance,
  onSkip,
}) {
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => {
      // consider small tolerance
      setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [text]);
  return (
    <div
      className="
        absolute left-[8%] right-[8%] bottom-[3%] h-[27%]
        bg-[rgba(255,207,255,0.7)]
        rounded-[8px] border-[3px] border-[#b297d8]
        px-[14px] py-[10px]
        flex flex-col
        cursor-pointer
      "
      onClick={onAdvance}
    >
      {/* 이름 */}
      <div className="text-[45px] font-semibold mb-[4px]">
        <span className="px-[10px] py-[3px] rounded-[6px] bg-transparent">
          {speaker}
        </span>
      </div>

      {/* 대사 텍스트 */}
      <div
        ref={textRef}
        className={`flex-1 flex ${
          isOverflowing ? "items-start" : "items-center"
        } text-[40px] leading-[1.4] pt-[6px] px-[4px] overflow-auto whitespace-pre-wrap break-words`}
        style={isOverflowing ? { transform: "translateY(-6px)" } : undefined}
      >
        <div className="min-h-[1em]">
          {text}
          {isAnimating && <span className="animate-pulse">▌</span>}
        </div>
      </div>

      {/* 스킵 버튼 */}
      <button
        type="button"
        className="
          self-end mt-[4px]
          px-[10px] py-[2px]
          border-none bg-transparent
          text-[20px] cursor-pointer
        "
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
      >
        →
      </button>
    </div>
  );
}
