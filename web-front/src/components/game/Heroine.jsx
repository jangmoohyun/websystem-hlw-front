// src/components/game/Heroine.jsx
export default function Heroine({
  position = "center",
  img = "/heroine/c.png",
}) {
  const base = "absolute bottom-0 bg-no-repeat bg-contain bg-bottom transform";

  const posClass =
    position === "left"
      ? "left-[25%] -translate-x-1/2"
      : position === "right"
      ? "left-[75%] -translate-x-1/2"
      : "left-1/2 -translate-x-1/2"; // center 기본

  return (
    <div
      className={`${base} ${posClass} w-[85vh] h-[85vh]`}
      style={{ backgroundImage: `url('${img}')` }}
    />
  );
}
