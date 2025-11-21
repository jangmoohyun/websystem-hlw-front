// src/components/game/HomeMain.jsx
import React, { useRef, useState } from "react";
import HomeTitle from "./HomeTitle";

export default function HomeMain() {
  const [hearts, setHearts] = useState([]);
  const areaRef = useRef(null);

  const backgrounds = [
    "/background/home_c.png",
    "/background/home_java.png",
    "/background/home_python.png",
  ];

  // 렌더링 될 때마다 메인 배경 랜덤 생성
  const [bgImage] = useState(() => {
    const idx = Math.floor(Math.random() * backgrounds.length);
    return backgrounds[idx];
  });

  const handleBackgroundClick = (e) => {
    if (!areaRef.current) return;

    const rect = areaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = Date.now() + Math.random();

    setHearts((prev) => [...prev, { id, x, y }]);

    // 1.2초 뒤에 하트 제거
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  };

  return (
    <main
      ref={areaRef}
      onClick={handleBackgroundClick}
      className="relative flex-1 h-full overflow-hidden cursor-pointer"
    >
      {/* 히로인 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      />

      {/* 뿌연 느낌 오버레이 */}
      <div className="absolute inset-0 bg-white/35 backdrop-blur-md" />

      {/* 중앙 타이틀 영역 */}
      <HomeTitle />

      {/* 하트 이펙트들 */}
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="pointer-events-none absolute text-pink-400 text-2xl animate-heart-float"
          style={{ left: heart.x, top: heart.y }}
        >
          ♥
        </span>
      ))}
    </main>
  );
}
