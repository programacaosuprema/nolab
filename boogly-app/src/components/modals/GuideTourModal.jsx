import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../autenticator/useAuth";

/**
 * GuidedTour — evita sobrepor o alvo
 * - tenta alternativas de posicionamento automaticamente
 * - reduz largura em telas pequenas
 * - mantém destaque (overlay) visível por baixo do popover
 */

const BASE_KEY = "guided_tour_done_v1";

const defaultSteps = [
  { id: "editor", title: "Editor", content: "Área de programação: arraste e conecte blocos aqui.", selector: '[data-tour="editor"]', placement: "right" },
  { id: "simulator", title: "Simulador", content: "Simulador: veja o passo a passo da execução.", selector: '[data-tour="simulator"]', placement: "left" },
  { id: "history", title: "Histórico", content: "Histórico: acompanhe as etapas já executadas.", selector: '[data-tour="history"]', placement: "bottom" },
  { id: "code", title: "Código", content: "Código gerado: copie ou baixe para estudar.", selector: '[data-tour="code"]', placement: "left" },
  { id: "challenges", title: "Desafios", content: "Desafios: resolva exercícios e valide suas soluções.", selector: '[data-tour="challenges"], #nav-challenges, .nav-challenges, a[href*=\"challenges\"]', placement: "top" }
];

function rectsIntersect(a, b) {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  );
}

function computePopoverRectForPlacement(targetRect, placement, popW, popH, padding = 12) {
  let top = 0, left = 0;
  switch (placement) {
    case "right":
      top = targetRect.top + targetRect.height / 2 - popH / 2 + window.scrollY;
      left = targetRect.right + padding + window.scrollX;
      break;
    case "left":
      top = targetRect.top + targetRect.height / 2 - popH / 2 + window.scrollY;
      left = targetRect.left - popW - padding + window.scrollX;
      break;
    case "top":
      top = targetRect.top - popH - padding + window.scrollY;
      left = targetRect.left + targetRect.width / 2 - popW / 2 + window.scrollX;
      break;
    case "bottom":
    default:
      top = targetRect.bottom + padding + window.scrollY;
      left = targetRect.left + targetRect.width / 2 - popW / 2 + window.scrollX;
      break;
  }

  // clamp to viewport with margin
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (left + popW > vw - 8) left = vw - popW - 12;
  if (left < 8) left = 8;
  if (top + popH > vh - 8) top = vh - popH - 12;
  if (top < 8) top = 8;

  return { top, left, width: popW, height: popH, topPx: `${Math.round(top)}px`, leftPx: `${Math.round(left)}px` };
}

function chooseBestPlacement(targetRect, preferred, popW, popH) {
  // ordem de tentativas: preferido, opposite, right, left, bottom, top
  const opposites = { right: "left", left: "right", top: "bottom", bottom: "top" };
  const order = [preferred, opposites[preferred] || preferred, "right", "left", "bottom", "top"];

  let best = null;
  let minOverlap = Infinity;

  for (const p of order) {
    const pop = computePopoverRectForPlacement(targetRect, p, popW, popH, 12);
    // convert pop to rect in viewport coords (without scroll offset, but that's okay for intersection check)
    const popRect = { left: pop.left - window.scrollX, top: pop.top - window.scrollY, width: pop.width, height: pop.height };
    const tgtRectViewport = { left: targetRect.left, top: targetRect.top, width: targetRect.width, height: targetRect.height };

    // if no intersection -> perfect
    if (!rectsIntersect(popRect, tgtRectViewport)) {
      return { placement: p, style: { top: pop.topPx, left: pop.leftPx, width: `${pop.width}px`, position: "absolute" } };
    }

    // otherwise compute overlap area and keep minimal
    const overlapX = Math.max(0, Math.min(popRect.left + popRect.width, tgtRectViewport.left + tgtRectViewport.width) - Math.max(popRect.left, tgtRectViewport.left));
    const overlapY = Math.max(0, Math.min(popRect.top + popRect.height, tgtRectViewport.top + tgtRectViewport.height) - Math.max(popRect.top, tgtRectViewport.top));
    const overlapArea = overlapX * overlapY;
    if (overlapArea < minOverlap) {
      minOverlap = overlapArea;
      best = { placement: p, pop, popRect };
    }
  }

  // se todas intersectam, retorna o que tem menor overlap, mas aumenta padding (move away)
  if (best) {
    // tentar deslocar para reduzir overlap: move pop outward on axis
    const p = best.placement;
    const pop = best.pop;
    const dx = p === "right" ? 12 : p === "left" ? -12 : 0;
    const dy = p === "bottom" ? 12 : p === "top" ? -12 : 0;
    const left = Math.min(Math.max(pop.left + dx, 8), window.innerWidth - pop.width - 8);
    const top = Math.min(Math.max(pop.top + dy, 8), window.innerHeight - pop.height - 8);
    return { placement: p, style: { top: `${Math.round(top)}px`, left: `${Math.round(left)}px`, width: `${pop.width}px`, position: "absolute" } };
  }

  // fallback center
  return { placement: preferred, style: { top: `${Math.round(window.innerHeight / 2 - popH / 2)}px`, left: `${Math.round(window.innerWidth / 2 - popW / 2)}px`, width: `${popW}px`, position: "absolute" } };
}

// small helper: find element with retries (keeps previous function's logic)
async function findElementWithRetries(selector, { retries = 10, delay = 200 } = {}) {
  if (!selector) return null;
  for (let i = 0; i < retries; i++) {
    const sel = Array.isArray(selector) ? selector.join(",") : selector;
    try {
      const el = document.querySelector(sel);
      if (el) return el;
    } catch (e) {
      const parts = sel.split(",").map(s => s.trim());
      for (const p of parts) {
        try {
          const el2 = document.querySelector(p);
          if (el2) return el2;
        } catch (_) {}
      }
    }
    await new Promise((res) => setTimeout(res, delay));
  }
  return null;
}

export default function GuidedTourModal({ steps = defaultSteps, autoOpen = true }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const userId = user?.id ?? user?.nickname ?? "anon";
  const storageKey = `${BASE_KEY}:${userId}`;

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [targetEl, setTargetEl] = useState(null);
  const [chosenStyle, setChosenStyle] = useState(null);

  useEffect(() => {
    try {
      const done = localStorage.getItem(storageKey);
      if (autoOpen && !done) setTimeout(() => setOpen(true), 450);
      else setOpen(false);
    } catch (e) {
      if (autoOpen) setOpen(true);
    }
    setIndex(0);
  }, [storageKey, autoOpen, userId]);

  useEffect(() => {
    if (!open) {
      setTargetRect(null);
      setTargetEl(null);
      setChosenStyle(null);
      return;
    }

    const stepObj = steps[index];
    if (!stepObj) return;

    let cancelled = false;

    (async () => {
      const el = await findElementWithRetries(stepObj.selector, { retries: 12, delay: 200 });
      if (cancelled) return;

      if (!el) {
        // avança se não encontrar
        setTimeout(() => {
          setIndex((i) => (i + 1 < steps.length ? i + 1 : i));
        }, 300);
        return;
      }

      // scroll into view (center)
      try { el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }); } catch (e) {}

      await new Promise((r) => setTimeout(r, 240));
      if (cancelled) return;
      const rect = el.getBoundingClientRect();

      // popover size adaptive
      const maxW = Math.min(360, Math.round(window.innerWidth - 48));
      const popW = Math.max(220, Math.min(340, maxW));
      const popH = 140; // approx — popover will wrap text so this is just estimate for placement

      const best = chooseBestPlacement(rect, stepObj.placement || "bottom", popW, popH);

      setTargetEl(el);
      setTargetRect(rect);
      setChosenStyle(best.style);
    })();

    const onResize = () => {
      if (!targetEl) return;
      const r = targetEl.getBoundingClientRect();
      setTargetRect(r);
      // recalc popover when resizing
      const maxW = Math.min(360, Math.round(window.innerWidth - 48));
      const popW = Math.max(220, Math.min(340, maxW));
      const popH = 140;
      const best = chooseBestPlacement(r, steps[index]?.placement || "bottom", popW, popH);
      setChosenStyle(best.style);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, steps]);

  const close = useCallback((markDone = false) => {
    setOpen(false);
    if (markDone) {
      try { localStorage.setItem(storageKey, "true"); } catch (e) {}
    }
  }, [storageKey]);

  const next = useCallback(() => {
    if (index + 1 < steps.length) setIndex((i) => i + 1);
    else close(true);
  }, [index, steps.length, close]);

  const prev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  if (typeof window === "undefined") return null;

  return (
    <>
      <button
        aria-label="Ajuda — tour"
        title="Ajuda"
        onClick={() => { setIndex(0); setOpen(true); try { localStorage.removeItem(storageKey); } catch(e) {} }}
        style={{
          position: "fixed", right: 18, bottom: 18, zIndex: 10005, width: 44, height: 44, borderRadius: "50%",
          border: "none", boxShadow: "0 6px 20px rgba(2,6,23,0.25)", background: theme?.primary, color: "#fff", cursor: "pointer"
        }}
      >?</button>

      {open && (
        <div
          className="guided-tour-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(6,7,12,0.28)",
            backdropFilter: "blur(1px)"
          }}
          onClick={() => close(true)}
        >
          {/* destaque do alvo: menor z-index que o popover para manter popover sobre o destaque,
              mas o popover é posicionado para não cobrir o alvo sempre que possível */}
          {targetRect && targetEl && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: targetRect.top + window.scrollY - 8,
                left: targetRect.left + window.scrollX - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                borderRadius: 8,
                boxShadow: `0 8px 30px ${theme?.primary}33, 0 0 0 2px ${theme?.primary}22`,
                border: `1px solid ${theme?.primary}55`,
                zIndex: 10001,
                pointerEvents: "none",
                transition: "all 220ms ease"
              }}
            />
          )}

          {/* popover — usa chosenStyle calculado para NÃO cobrir o alvo quando possível */}
          {chosenStyle && (
            <div
              className="guided-tour-popover"
              style={{
                ...chosenStyle,
                zIndex: 10003,
                boxSizing: "border-box",
                pointerEvents: "auto"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ background: theme?.panel, color: theme?.text, border: `1px solid ${theme?.border}`, borderRadius: 12, padding: 14, boxShadow: "0 10px 40px rgba(2,6,23,0.16)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 700, ...theme?.typography?.h3 }}>{steps[index]?.title}</div>
                  <div style={{ color: theme?.muted, fontSize: 12 }}>{index + 1}/{steps.length}</div>
                </div>

                <div style={{ marginTop: 8, color: theme?.muted, ...theme?.typography?.body, fontSize: 14 }}>
                  {steps[index]?.content}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
                  <div>
                    <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={index === 0} style={{ background: "transparent", border: "none", color: index === 0 ? theme?.border : theme?.text, cursor: index === 0 ? "not-allowed" : "pointer" }}>
                      ← Voltar
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); close(true); }} style={{ background: "transparent", border: `1px solid ${theme?.border}`, padding: "6px 10px", borderRadius: 8, color: theme?.muted, cursor: "pointer" }}>
                      Pular
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ background: theme?.primary, border: "none", padding: "8px 12px", borderRadius: 8, color: "#fff", cursor: "pointer" }}>
                      {index === steps.length - 1 ? "Entendi" : "Próximo →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}