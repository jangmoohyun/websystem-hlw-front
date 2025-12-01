import { useEffect, useState } from "react";

// 간단한 타이핑 훅: text를 받아 displayedText, isAnimating 반환
export default function useTyping(text, speed = 25) {
  const [displayed, setDisplayed] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const full = text ?? "";
    if (!full) {
      setDisplayed("");
      setIsAnimating(false);
      return;
    }

    let i = 0;
    setDisplayed("");
    setIsAnimating(true);

    const t = setInterval(() => {
      i += 1;
      setDisplayed(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(t);
        setIsAnimating(false);
      }
    }, speed);

    return () => clearInterval(t);
  }, [text, speed]);

  return { displayed, isAnimating, setDisplayed, setIsAnimating };
}
