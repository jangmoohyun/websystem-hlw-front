// src/components/game/HomeMenu.jsx
import React from "react";

export default function HomeMenu({
  onNewGame,
  onContinue,
  onUserPage,
  onSettings,
}) {
  return (
    <aside className="w-80 h-full bg-white/70 border-r border-white/60 backdrop-blur-sm flex flex-col justify-between px-8 py-10 shadow-xl">
      {/* 상단 로고 */}
      <div>
        <p className="text-sm tracking-[0.3em] text-pink-400 uppercase mb-3">
          ♥ Coding Love ♥
        </p>
        <h1 className="text-3xl font-extrabold leading-tight text-pink-500 drop-shadow-sm">
          Hello
          <br />
          Love World !
        </h1>
      </div>

      {/* 메뉴들 */}
      <nav className="flex flex-col gap-4 mb-4">
        <button
          className="w-full h-14 flex items-center justify-between rounded-full bg-pink-400/90 hover:bg-pink-500 
                 text-white px-6 text-lg font-bold shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl"
          onClick={onNewGame}
        >
          <span>새로 시작하기</span>
          <span className="text-base opacity-90">▶</span>
        </button>

        <button
          className="w-full h-14 flex items-center justify-between rounded-full bg-pink-300/90 hover:bg-pink-400 
                 text-white px-6 text-lg font-bold shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl"
          onClick={onContinue}
        >
          <span>이어하기</span>
          <span className="text-base opacity-90">⏵</span>
        </button>

        <button
          className="w-full h-14 flex items-center justify-between rounded-full bg-pink-200/90 hover:bg-pink-300 
                 text-pink-700 px-6 text-lg font-bold shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl"
          onClick={onUserPage}
        >
          <span>유저 페이지</span>
          <span className="text-base opacity-90">👤</span>
        </button>

        <button
          className="w-full h-14 flex items-center justify-between rounded-full bg-white/90 hover:bg-pink-50 
                 text-pink-500 px-6 text-lg font-bold shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl"
          onClick={onSettings}
        >
          <span>설정</span>
          <span className="text-base opacity-90">⚙</span>
        </button>
      </nav>
    </aside>
  );
}
