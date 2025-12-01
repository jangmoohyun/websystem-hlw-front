// src/components/game/Menu.jsx
import { useState } from "react";

export default function Menu({ onSave, onLoad, onGoHome, onSetting }) {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen((prev) => !prev);

  const handleClickItem = (handler) => {
    handler && handler();
    setOpen(false);
  };

  return (
    <div
      className={`
        absolute top-[16px] right-[20px] z-30
        bg-white border border-[#333] rounded-[8px] p-[4px]
        overflow-visible
        transition-[width] duration-200
        ${open ? "w-[180px]" : "w-[44px]"}
      `}
    >
      {/* 햄버거 버튼 */}
      <button
        type="button"
        className="
          w-full h-[36px]
          flex flex-col justify-center items-start
          gap-[5px]
          bg-transparent border-none cursor-pointer
          pl-[6px]
        "
        onClick={toggleMenu}
      >
        <span className="w-[22px] h-[2px] rounded-[1px] bg-black" />
        <span className="w-[22px] h-[2px] rounded-[1px] bg-black" />
        <span className="w-[22px] h-[2px] rounded-[1px] bg-black" />
      </button>

      {open && (
        <div className="mt-[6px] flex flex-col gap-[4px] w-full">
          {/* 저장하기 */}
          <button
            className="
              relative w-full
              px-[12px] pl-[15px] py-[8px]
              text-left text-[15px]
              bg-transparent border-none
              text-[#222] cursor-pointer
              hover:bg-[rgba(0,0,0,0.07)]
            "
            onClick={() => handleClickItem(onSave)}
          >
            <span className="absolute left-[3px] top-[4px] bottom-[4px] w-[6px] rounded-[4px] bg-[#ffd400ff]" />
            저장하기
          </button>

          {/* 불러오기 */}
          <button
            className="
              relative w-full
              px-[12px] pl-[15px] py-[8px]
              text-left text-[15px]
              bg-transparent border-none
              text-[#222] cursor-pointer
              hover:bg-[rgba(0,0,0,0.07)]
            "
            onClick={() => handleClickItem(onLoad)}
          >
            <span className="absolute left-[3px] top-[4px] bottom-[4px] w-[6px] rounded-[4px] bg-[#ff2b8cff]" />
            불러오기
          </button>

          {/* 설정 열기 */}
          <button
            className="
              relative w-full
              px-[12px] pl-[15px] py-[8px]
              text-left text-[15px]
              bg-transparent border-none
              text-[#222] cursor-pointer
              hover:bg-[rgba(0,0,0,0.07)]
            "
            onClick={() => handleClickItem(onSetting)}
          >
            <span className="absolute left-[3px] top-[4px] bottom-[4px] w-[6px] rounded-[4px] bg-[#8a2be2ff]" />
            설정
          </button>

          {/* 홈으로 나가기 */}
          <button
            className="
              relative w-full
              px-[12px] pl-[15px] py-[8px]
              text-left text-[15px]
              bg-transparent border-none
              text-[#222] cursor-pointer
              hover:bg-[rgba(0,0,0,0.07)]
            "
            onClick={() => handleClickItem(onGoHome)}
          >
            <span className="absolute left-[3px] top-[4px] bottom-[4px] w-[6px] rounded-[4px] bg-[#01bcd4ff]" />
            홈으로 나가기
          </button>
        </div>
      )}
    </div>
  );
}
