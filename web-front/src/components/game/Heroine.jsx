// src/components/game/Heroine.jsx
export default function Heroine({
  position = "center",
  img = "/heroine/c.png",
  active = false,
  size = "85vh",
}) {
  // base: 포지션과 배경 설정
  const base =
    "absolute bottom-0 bg-no-repeat bg-contain bg-bottom transform transition-all duration-300";

  const posClass =
    position === "left"
      ? "left-[25%] -translate-x-1/2"
      : position === "right"
      ? "left-[75%] -translate-x-1/2"
      : "left-1/2 -translate-x-1/2"; // center 기본

  // 활성화 상태에 따라 필터/스케일 적용
  // 투명도(Opacity)나 밝기 조절은 적용하지 않음
  const stateClass = active
    ? "filter-none scale-100"
    : "filter grayscale scale-95";

  return (
    <div
      className={`${base} ${posClass} ${stateClass}`}
      style={{ backgroundImage: `url('${img}')`, width: size, height: size }}
      aria-hidden={!active}
    />
  );
}
