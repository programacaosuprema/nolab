// src/components/visualizers/StackVisualizer.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../../theme/useTheme';

/* helpers */
function getNodeColor(index, theme) {
  const palette = [
    theme?.primary,
    theme?.success,
    theme?.warning,
    theme?.danger,
    theme?.blocks?.structure,
    theme?.blocks?.logic,
  ].filter(Boolean);
  return palette[index % palette.length] ?? '#6366F1';
}
function getNodeSize(length) {
  if (length <= 6) return 64;
  if (length <= 12) return 52;
  if (length <= 20) return 44;
  return 36;
}
function safeValue(value) {
  if (value === null || value === undefined) return '∅';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * StackVisualizer
 * - data: objeto { nome: array, ... }
 * - step: { type, index, ... } (opcional)
 * - showTitle: boolean (default true)
 *
 * Com toggle "Orientação" para alternar Topo = 'end' (padrão) ou 'start'.
 */
export default function StackVisualizer({ data, step = {}, showTitle = true }) {
  const { theme } = useTheme();
  const containerRefs = useRef({});
  const [topAt, setTopAt] = useState('end'); // 'end' ou 'start'

  // sanitização
  const safeData =
    data && typeof data === 'object' && !Array.isArray(data) ? data : {};

  // índice ativo (quando engine usa traverse)
  const activeIndex =
    step?.type === 'traverse' && typeof step.index === 'number'
      ? step.index
      : null;

  // highlight pré-remoção (opcional)
  const isHighlightRemove = step?.type === 'highlight_remove';
  const removingIndexFromStep =
    isHighlightRemove && typeof step.index === 'number' ? step.index : null;

  // scrollIntoView: precisa usar o id que corresponde ao índice ORIGINAL (stack-{name}-node-{index})
  useEffect(() => {
    if (activeIndex === null) return;

    Object.keys(containerRefs.current).forEach((name) => {
      const id = `stack-${name}-node-${activeIndex}`;
      const el = document.getElementById(id);
      const container = containerRefs.current[name];
      if (el && container) {
        try {
          // Se topAt === 'start', o elemento pode estar no topo; usamos block:'nearest' para evitar deslocar demais
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        } catch {
          const rect = el.getBoundingClientRect();
          const contRect = container.getBoundingClientRect();
          container.scrollTop +=
            rect.top - contRect.top - contRect.height / 2 + rect.height / 2;
        }
      }
    });
  }, [activeIndex, safeData, topAt]);

  // reset scroll quando não há activeIndex (tentativas com delays)
  useEffect(() => {
    if (activeIndex !== null) return;
    const containers = Object.values(containerRefs.current).filter(Boolean);
    const attempts = [0, 40, 120, 300];
    containers.forEach((container) => {
      attempts.forEach((delay) => {
        setTimeout(() => {
          try {
            // se topAt === 'start', queremos ver o começo -> scrollTop = 0
            // se topAt === 'end', mostrar topo que está no fim -> scrollTop = container.scrollHeight
            if (topAt === 'start') {
              container.scrollTo({ top: 0, behavior: 'auto' });
            } else {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: 'auto',
              });
            }
          } catch {
            container.scrollTop =
              topAt === 'start' ? 0 : container.scrollHeight;
          }
        }, delay);
      });
    });
  }, [JSON.stringify(safeData), activeIndex, topAt]);

  if (!safeData || Object.keys(safeData).length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm"
        style={{
          color: theme?.muted,
          fontSize: theme?.typography?.body?.fontSize,
        }}
      >
        Nenhuma pilha
      </div>
    );
  }

  return (
    <div
      style={{
        color: theme?.text,
        fontSize: theme?.typography?.body?.fontSize,
      }}
      className="flex flex-col gap-4 h-full"
    >
      {/* Controle de orientação (toggle) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ color: theme?.muted, ...theme?.typography?.small }}>
            Orientação:
          </label>
          <button
            onClick={() => setTopAt((s) => (s === 'end' ? 'start' : 'end'))}
            className="px-3 py-1 rounded"
            style={{
              background: theme?.primary,
              color: '#fff',
              fontWeight: 600,
            }}
            title="Alternar Topo da Pilha"
          >
            {topAt === 'end' ? 'Topo = fim' : 'Topo = início'}
          </button>
        </div>
      </div>

      {/* Renderização das pilhas */}
      {Object.entries(safeData)
        .filter(([name]) => name !== 'variables')
        .map(([name, stack]) => {
          const safeStack = Array.isArray(stack) ? stack : [];
          const nodeSize = getNodeSize(safeStack.length);
          const fontSize = Math.max(12, Math.floor(nodeSize / 3));
          const removingIndex =
            isHighlightRemove && removingIndexFromStep !== null
              ? removingIndexFromStep
              : isHighlightRemove
                ? topAt === 'end'
                  ? safeStack.length - 1
                  : 0
                : null;

          // Decide a ordem visual:
          // - se topAt === 'end' -> render reversed (último elemento visual primeiro)
          // - se topAt === 'start' -> render normal (índice 0 em cima)
          const toRender =
            topAt === 'end' ? safeStack.slice().reverse() : safeStack.slice();

          return (
            <div key={name || 'stack'} className="flex flex-col h-full">
              {showTitle && (
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: theme?.text, ...theme?.typography?.h3 }}
                >
                  {name || 'Pilha'}
                </h3>
              )}

              <div
                ref={(el) => (containerRefs.current[name] = el)}
                className="overflow-auto h-full py-2"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme?.spacing?.sm,
                  paddingLeft: theme?.spacing?.sm,
                  paddingRight: theme?.spacing?.sm,
                  boxSizing: 'border-box',
                }}
              >
                <div className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {toRender.map((item, renderIdx) => {
                      // calcula o índice ORIGINAL com base em renderIdx e topAt
                      const originalIndex =
                        topAt === 'end'
                          ? safeStack.length - 1 - renderIdx
                          : renderIdx;
                      const isTop = originalIndex === safeStack.length - 1;
                      const isActive = activeIndex === originalIndex;
                      const isRemoving = removingIndex === originalIndex;

                      return (
                        <motion.div
                          key={`stack-${name}-${originalIndex}-${safeValue(item)}`}
                          layout
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: isActive || isRemoving ? 1.02 : 1,
                          }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="text-xs w-16 text-right"
                            style={{
                              color: theme?.muted,
                              ...theme?.typography?.small,
                            }}
                          >
                            Posição {originalIndex}
                          </div>

                          <div className="flex flex-col items-center">
                            {isTop && (
                              <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="mb-2 px-3 py-1 text-xs font-semibold rounded-full"
                                style={{
                                  background: `${theme?.primary}20`,
                                  color: theme?.primary,
                                  border: `1px solid ${theme?.primary}`,
                                  ...theme?.typography?.small,
                                }}
                              >
                                Topo
                              </motion.div>
                            )}

                            <motion.div
                              id={`stack-${name}-node-${originalIndex}`}
                              whileHover={{ scale: 1.03 }}
                              className="flex items-center justify-center rounded-2xl border-2 font-bold shadow-lg"
                              style={{
                                width: nodeSize,
                                height: nodeSize,
                                fontSize,
                                borderColor: theme?.border,
                                background: isRemoving
                                  ? theme?.danger
                                  : isActive
                                    ? theme?.warning
                                    : getNodeColor(originalIndex, theme),
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: 6,
                                boxSizing: 'border-box',
                                minWidth: nodeSize,
                              }}
                            >
                              <span
                                style={{
                                  wordBreak: 'break-word',
                                  maxWidth: nodeSize - 12,
                                  lineHeight: 1,
                                }}
                              >
                                {safeValue(item)}
                              </span>
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
