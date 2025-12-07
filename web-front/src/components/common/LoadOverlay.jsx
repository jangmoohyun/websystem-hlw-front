// src/components/game/LoadOverlay.jsx

export default function LoadOverlay({ slots, onSelect, onClose }) {
  return (
    <div
      className="absolute inset-0 bg-black/40 flex items-center justify-center z-30"
      onClick={onClose} // 바깥 클릭하면 닫기
    >
      <div
        className="
            bg-white/90 rounded-2xl shadow-xl
            w-[80%] max-w-4xl h-[70%]
            flex flex-col
            p-6
          "
        onClick={(e) => e.stopPropagation()} // 안쪽 클릭은 닫기 막기
      >
        {/* 상단 타이틀 + X 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">저장 불러오기</h2>
          <button
            className="text-xl px-2 py-1 rounded-md hover:bg-black/5"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* 카드 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
          {slots.map((slot, idx) => {
            const isEmpty = !slot || !slot.title;

            return (
              <button
                key={idx}
                className={`
                    text-left rounded-xl border
                    p-4
                    transition
                    ${
                      isEmpty
                        ? "border-dashed border-gray-300 bg-gray-50/80 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 bg-white hover:shadow-md hover:-translate-y-[2px] cursor-pointer"
                    }
                  `}
                onClick={() => {
                  if (isEmpty) return;
                  onSelect(slot, idx);
                }}
              >
                <div className="text-sm text-gray-500 mb-1">슬롯 {idx + 1}</div>

                <div className="text-lg font-semibold mb-1">
                  {isEmpty ? "빈 슬롯" : slot.title}
                </div>

                {!isEmpty && (
                  <>
                    <div className="text-sm text-gray-600 mb-1">
                      {slot.description}
                    </div>
                    {slot.progress && (
                      <div className="text-xs text-gray-500">
                        진행도: {slot.progress}
                      </div>
                    )}
                    {slot.savedAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        저장 시간: {slot.savedAt}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
