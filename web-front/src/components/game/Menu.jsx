// src/components/game/GameMenu.jsx
import { useState } from "react";

export default function Menu({ onSave, onLoad, onGoHome }) {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen((prev) => !prev);

  const handleClickItem = (handler) => {
    handler && handler();
    setOpen(false); // 메뉴 닫기
  };

  return (
    <div className={open ? "game-menu open" : "game-menu"}>
      {/* 햄버거 버튼 */}
      <button type="button" className="hamburger-btn" onClick={toggleMenu}>
        {/* 간단한 햄버거 아이콘 */}
        <span />
        <span />
        <span />
      </button>

      {/* 드롭다운 메뉴 */}
      {open && (
        <div className="menu-dropdown">
          <button className="menu-item" onClick={() => handleClickItem(onSave)}>
            저장하기
          </button>
          <button className="menu-item" onClick={() => handleClickItem(onLoad)}>
            불러오기
          </button>
          <button
            className="menu-item"
            onClick={() => handleClickItem(onGoHome)}
          >
            홈으로 나가기
          </button>
        </div>
      )}
    </div>
  );
}
