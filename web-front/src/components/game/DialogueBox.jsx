// src/components/game/DialogueBox.jsx
export default function DialogueBox({
  speaker,
  text,
  isAnimating,
  onAdvance,
  onSkip,
}) {
  return (
    <div
      className="
        absolute left-[8%] right-[8%] bottom-[3%] h-[22%]
        bg-[rgba(255,207,255,0.7)]
        rounded-[8px] border-[3px] border-[#b297d8]
        px-[14px] py-[10px]
        flex flex-col
        cursor-pointer
      "
      onClick={onAdvance}
    >
      {/* 이름 */}
      <div className="text-[40px] font-semibold mb-[4px]">
        <span className="px-[8px] py-[3px] rounded-[6px] bg-transparent">
          {speaker}
        </span>
      </div>

      {/* 대사 텍스트 */}
      <div className="flex-1 text-[42px] leading-[1.5] pt-[6px] px-[4px] overflow-hidden">
        {text}
        {isAnimating && <span className="animate-pulse">▌</span>}
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
