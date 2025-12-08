import { useEffect, useState } from "react";

// 간단한 타이핑 훅: text를 받아 displayedText, isAnimating 반환
export default function useTyping(text, speed = 25) {
  const [displayed, setDisplayed] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const full = text ?? "";
    let intervalId = null;
    let startTimer = null;

    if (!full) {
      // 비동기적으로 상태를 초기화하여 effect 내 동기적 setState 경고를 피합니다.
      startTimer = setTimeout(() => {
        setDisplayed("");
        setIsAnimating(false);
      }, 0);

      return () => {
        clearTimeout(startTimer);
      };
    }

    // 애니메이션 시작도 비동기적으로 트리거합니다.
    startTimer = setTimeout(() => {
      setDisplayed("");
      setIsAnimating(true);

      let i = 0;
      intervalId = setInterval(() => {
        i += 1;
        setDisplayed(full.slice(0, i));
        if (i >= full.length) {
          clearInterval(intervalId);
          setIsAnimating(false);
        }
      }, speed);
    }, 0);

    return () => {
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed]);

  return { displayed, isAnimating, setDisplayed, setIsAnimating };
}
