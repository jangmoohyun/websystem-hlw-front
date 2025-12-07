// src/components/game/ChoiceOverlay.jsx
export default function ChoiceOverlay({ choices, onChoice }) {
  return (
    <div className="absolute inset-0 bg-[rgba(0,0,0,0.35)] flex justify-center items-end z-10">
      <div
        className="
          w-full h-[70%]
          bg-transparent
          px-[70px] py-[50px]
          min-w-[450px] max-w-[1000px]
          flex flex-col gap-[20px]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {choices.map((label, idx) => (
          <button
            key={idx}
            className="
              h-[60px]
              rounded-[10px]
              px-[12px] py-[10px]
              text-[28px] text-center
              cursor-pointer
              bg-[rgba(229,239,255,0.85)]
              transition
              hover:bg-[rgba(238,245,255,0.95)]
              hover:shadow-[0_4px_10px_rgba(0,0,0,0.15)]
              hover:-translate-y-[1px]
              active:translate-y-[1px]
              active:shadow-none
            "
            onClick={() => onChoice(idx)}
          >
            {/* {idx + 1}. */}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
