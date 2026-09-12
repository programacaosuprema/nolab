// src/hooks/useCountdown.js
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useCountdown
 * - totalSeconds: número total de segundos (ex: challenge.timeLimit)
 * - enabled: boolean (se deve iniciar imediatamente)
 * - keyId: string para persistir o endTimestamp no sessionStorage (ex: `challenge_<publicId>_end`)
 * - onExpire: callback quando expirar
 *
 * Retorna:
 * { secondsLeft, running, start, pause, reset, percent }
 */
export default function useCountdown({
  totalSeconds = 120,
  enabled = false,
  keyId = "countdown_default",
  onExpire = null,
  warningThresholds = { first: 60, last: 10 }
} = {}) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(enabled);
  const endTsRef = useRef(null);
  const intervalRef = useRef(null);

  const computeFromStored = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(keyId);
      if (!raw) return null;
      const parsed = Number(raw);
      if (!parsed || isNaN(parsed)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }, [keyId]);

  const persistEnd = (endTs) => {
    try {
      sessionStorage.setItem(keyId, String(endTs));
    } catch (e) {
      // ignore
    }
  };
  const clearPersist = () => {
    try {
      sessionStorage.removeItem(keyId);
    } catch (e) {}
  };

  const calcAndSet = useCallback(() => {
    const now = Date.now();
    const end = endTsRef.current;
    if (!end) {
      setSecondsLeft(totalSeconds);
      return;
    }
    const diff = Math.max(0, Math.ceil((end - now) / 1000));
    setSecondsLeft(diff);
    if (diff <= 0) {
      // expired
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setRunning(false);
      clearPersist();
      if (typeof onExpire === "function") {
        try { onExpire(); } catch (e) { console.error(e); }
      }
    }
  }, [clearPersist, onExpire, totalSeconds]);

  const start = useCallback((seconds = null) => {
    const secs = seconds == null ? totalSeconds : Number(seconds);
    const end = Date.now() + secs * 1000;
    endTsRef.current = end;
    persistEnd(end);
    setRunning(true);
    // run immediately
    calcAndSet();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(calcAndSet, 250);
  }, [calcAndSet, persistEnd, totalSeconds]);

  const pause = useCallback(() => {
    // on pause we calculate remaining and persist that remaining as seconds (so we can resume)
    if (!endTsRef.current) return;
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endTsRef.current - now) / 1000));
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    endTsRef.current = null;
    // persist remaining in a special key so resume can pick it up (optional)
    try {
      sessionStorage.setItem(`${keyId}_paused_remaining`, String(remaining));
    } catch (e) {}
    setRunning(false);
    setSecondsLeft(remaining);
  }, [keyId]);

  const resume = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(`${keyId}_paused_remaining`);
      const remaining = raw ? Number(raw) : null;
      if (remaining && !isNaN(remaining) && remaining > 0) {
        start(remaining);
        sessionStorage.removeItem(`${keyId}_paused_remaining`);
      } else {
        // nothing: start fresh
        start();
      }
    } catch (e) {
      start();
    }
  }, [keyId, start]);

  const reset = useCallback((seconds = null) => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    endTsRef.current = null;
    clearPersist();
    const secs = seconds == null ? totalSeconds : Number(seconds);
    setSecondsLeft(secs);
    setRunning(false);
  }, [clearPersist, totalSeconds]);

  // start automatically if enabled OR if there's a persisted endTs
  useEffect(() => {
    try {
      const persisted = computeFromStored();
      if (persisted && enabled) {
        endTsRef.current = persisted;
        setRunning(true);
        calcAndSet();
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(calcAndSet, 250);
        return () => {};
      }
      if (enabled) start();
      return () => {};
    } catch (err) {
      console.error("useCountdown init error", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  const percent = Math.max(0, Math.min(100, Math.round((secondsLeft / totalSeconds) * 100)));

  return {
    secondsLeft,
    running,
    start,
    pause,
    resume,
    reset,
    percent,
    warningFirst: secondsLeft <= (warningThresholds.first ?? 60) && secondsLeft > (warningThresholds.last ?? 10),
    warningLast: secondsLeft <= (warningThresholds.last ?? 10)
  };
}