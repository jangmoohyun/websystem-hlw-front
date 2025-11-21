// src/components/game/HomeTitle.jsx
import React from "react";

export default function HomeTitle() {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center text-center px-4">
      <p className="text-xs md:text-sm tracking-[0.45em] text-white/90 uppercase mb-3 drop-shadow">
        ♥♥♥ Coding Love ♥♥♥
      </p>

      <h2
        className="text-5xl md:text-7xl font-extrabold text-pink-500 
                         drop-shadow-[0_0_14px_rgba(255,255,255,0.9)]
                         mb-4 select-none"
      >
        Hello Love World !
      </h2>

      <div className="flex flex-col items-center gap-1 mb-8">
        <div className="w-64 h-[3px] bg-white/80 rounded-full" />
        <div className="w-44 h-[3px] bg-white/60 rounded-full" />
      </div>

      <div
        className="rounded-full bg-pink-500/95 text-white px-6 py-3 
                          text-xs md:text-sm font-medium shadow-lg select-none"
      >
        좌측 메뉴를 선택하여 게임을 시작해 주세요
      </div>
    </div>
  );
}
