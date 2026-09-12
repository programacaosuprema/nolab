import { useEffect, useRef, useState, useCallback } from "react";

export default function useCountdown({
  totalSeconds = 120,
  onExpire = null
} = {}) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef(null);
  const endRef = useRef(null);

  const start = useCallback((seconds) => {
    const duration = Number(seconds) || totalSeconds;

    const end = Date.now() + duration * 1000;
    endRef.current = end;

    if (intervalRef.current) clearInterval(intervalRef.current);

    const tick = () => {
      const diff = Math.max(0, Math.ceil((end - Date.now()) / 1000));

      setSecondsLeft(diff);

      if (diff <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        if (onExpire) onExpire();
      }
    };

    tick(); // executa imediatamente
    intervalRef.current = setInterval(tick, 1000);

  }, [totalSeconds, onExpire]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    endRef.current = null;
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const percent = Math.max(0, Math.min(100,
    Math.round((secondsLeft / totalSeconds) * 100)
  ));

  return {
    secondsLeft,
    start,
    reset,
    percent,
    warningFirst: secondsLeft <= 60 && secondsLeft > 10,
    warningLast: secondsLeft <= 10
  };
}