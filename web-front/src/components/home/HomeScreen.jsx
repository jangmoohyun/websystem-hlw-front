// src/components/game/HomeScreen.jsx
import React from "react";
import HomeMenu from "./HomeMenu";
import HomeMain from "./HomeMain";

import LoadOverlay from "../common/LoadOverlay";

export default function HomeScreen({
  onNewGame,
  onContinue,
  onUserPage,
  onSettings,
}) {
  return (
    <div className="w-screen h-screen flex bg-pink-100 overflow-hidden font-['Pretendard','Noto Sans KR',system-ui]">
      {/* 왼쪽 메뉴 바 */}
      <HomeMenu
        onNewGame={onNewGame}
        onContinue={onContinue}
        onUserPage={onUserPage}
        onSettings={onSettings}
      />

      {/* 오른쪽 메인 영역 */}
      <HomeMain />
    </div>
  );
}
