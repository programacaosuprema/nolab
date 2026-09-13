import { useEffect, useRef, useState, useCallback } from "react";

export default function useCountdown({
  totalSeconds = 120,
  keyId,
  onExpire
}) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef(null);
  const endRef = useRef(null);

  const start = useCallback((seconds) => {
    const key = keyId;

    let end = sessionStorage.getItem(key);

    // 🔥 se já existe tempo salvo → continua
    if (end) {
      end = Number(end);
    } else {
      end = Date.now() + seconds * 1000;
      sessionStorage.setItem(key, String(end));
    }

    endRef.current = end;

    if (intervalRef.current) clearInterval(intervalRef.current);

    const tick = () => {
      const diff = Math.max(0, Math.ceil((end - Date.now()) / 1000));

      setSecondsLeft(diff);

      if (diff <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        sessionStorage.removeItem(key);

        if (onExpire) onExpire();
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

  }, [keyId, onExpire]);

  const reset = useCallback(() => {
    const key = keyId;

    clearInterval(intervalRef.current);
    intervalRef.current = null;
    endRef.current = null;

    sessionStorage.removeItem(key);
    setSecondsLeft(totalSeconds);
  }, [keyId, totalSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const percent = Math.max(
    0,
    Math.min(100, Math.round((secondsLeft / totalSeconds) * 100))
  );

  return {
    secondsLeft,
    start,
    reset,
    percent,
    warningFirst: secondsLeft <= 60 && secondsLeft > 10,
    warningLast: secondsLeft <= 10
  };
}