// src/components/visualizers/QueueVisualizer.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../../theme/useTheme';

function getNodeColor(index, theme) {
  const palette = [
    theme.primary,
    theme.success,
    theme.warning,
    theme.danger,
    theme.blocks?.structure,
    theme.blocks?.logic,
  ].filter(Boolean);
  return palette[index % palette.length] ?? '#6366F1';
}

function getNodeSize(length) {
  if (length <= 5) return 64;
  if (length <= 8) return 52;
  if (length <= 12) return 42;
  if (length <= 20) return 36;
  return 30;
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

export default function QueueVisualizer({ data, step, showTitle = true }) {
  const { theme } = useTheme();
  const containerRefs = useRef({});

  const safeData =
    data && typeof data === 'object' && !Array.isArray(data) ? data : {};

  const activeIndex =
    step?.type === 'traverse' && typeof step.index === 'number'
      ? step.index
      : null;

  const isHighlightRemove = step?.type === 'highlight_remove';
  const removingIndexFromStep =
    isHighlightRemove && typeof step.index === 'number' ? step.index : null;

  useEffect(() => {
    if (activeIndex === null) return;
    Object.keys(containerRefs.current).forEach((name) => {
      const el = document.getElementById(`queue-${name}-node-${activeIndex}`);
      const container = containerRefs.current[name];
      if (el && container) {
        try {
          el.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
          });
        } catch {
          const rect = el.getBoundingClientRect();
          const contRect = container.getBoundingClientRect();
          container.scrollLeft +=
            rect.left - contRect.left - contRect.width / 2 + rect.width / 2;
        }
      }
    });
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex !== null) return;
    const attempts = [0, 40, 120, 300];
    Object.values(containerRefs.current)
      .filter(Boolean)
      .forEach((container) => {
        attempts.forEach((delay) => {
          setTimeout(() => {
            try {
              container.scrollTo({ left: 0, behavior: 'auto' });
            } catch {
              container.scrollLeft = 0;
            }
          }, delay);
        });
      });
  }, [JSON.stringify(safeData), activeIndex]);

  if (!safeData || Object.keys(safeData).length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm"
        style={{ color: theme.muted }}
      >
        Nenhuma fila
      </div>
    );
  }

  return (
    <div
      style={{ color: theme.text, fontSize: theme.typography.body.fontSize }}
      className="flex flex-col gap-8"
    >
      {Object.entries(safeData)
        .filter(([name]) => name !== 'variables')
        .map(([name, queue]) => {
          const safeQueue = Array.isArray(queue) ? queue : [];
          const nodeSize = getNodeSize(safeQueue.length);
          const gap = nodeSize < 50 ? 8 : 16;
          const fontSize = Math.max(12, Math.floor(nodeSize / 3));
          const paddingInline =
            typeof theme.spacing.sm === 'string'
              ? parseInt(theme.spacing.sm) || 12
              : (theme.spacing.sm ?? 12);

          const removingIndex =
            isHighlightRemove && removingIndexFromStep !== null
              ? removingIndexFromStep
              : isHighlightRemove
                ? 0
                : null;

          return (
            <div key={name || 'queue'} className="space-y-3">
              {showTitle && (
                <h3
                  className="text-lg font-semibold"
                  style={{ color: theme.text, ...theme.typography.h3 }}
                >
                  {name || 'Fila'}
                </h3>
              )}

              {safeQueue.length === 0 ? (
                <div
                  className="text-sm"
                  style={{ color: theme.muted, ...theme.typography.small }}
                >
                  Fila vazia
                </div>
              ) : (
                <div
                  ref={(el) => (containerRefs.current[name] = el)}
                  className="w-full overflow-x-auto"
                  style={{
                    scrollSnapType: 'x mandatory',
                    scrollPaddingInlineStart: `${paddingInline}px`,
                    paddingBottom: theme.spacing.sm,
                  }}
                >
                  <div
                    className="flex min-w-max items-center py-3"
                    style={{
                      gap,
                      alignItems: 'flex-start',
                      paddingLeft: theme.spacing.sm,
                      paddingRight: theme.spacing.sm,
                      justifyContent: 'flex-start',
                    }}
                  >
                    <AnimatePresence initial={false}>
                      {safeQueue.map((item, index) => {
                        const isFirst = index === 0;
                        const isLast = index === safeQueue.length - 1;
                        const isActive = activeIndex === index;
                        const isRemoving = removingIndex === index;

                        const nodeBg = isRemoving
                          ? theme.danger
                          : isActive
                            ? theme.warning
                            : getNodeColor(index, theme);

                        return (
                          <motion.div
                            key={`queue-${name}-${index}-${safeValue(item)}`}
                            layout
                            initial={{ opacity: 0, scale: 0.8, y: -8 }}
                            animate={{
                              opacity: 1,
                              scale: isActive || isRemoving ? 1.12 : 1,
                              y: 0,
                            }}
                            exit={{ opacity: 0, scale: 0.4, y: 30 }}
                            transition={{ duration: 0.28 }}
                            className="flex items-center gap-4"
                            style={{ scrollSnapAlign: 'start' }}
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className="mb-2 rounded-full px-3 py-1 text-xs font-medium"
                                style={{
                                  background: theme.card,
                                  color: theme.muted,
                                  border: `1px solid ${theme.border}`,
                                  ...theme.typography.small,
                                }}
                              >
                                Posição {index}
                              </div>

                              <div className="mb-2 flex flex-col items-center gap-1">
                                {isFirst && (
                                  <div
                                    className="rounded-full px-3 py-1 text-xs font-semibold"
                                    style={{
                                      background: theme.success,
                                      color: '#fff',
                                      ...theme.typography.small,
                                    }}
                                  >
                                    Frente
                                  </div>
                                )}
                                {isLast && !isFirst && (
                                  <div
                                    className="rounded-full px-3 py-1 text-xs font-semibold"
                                    style={{
                                      background: theme.primary,
                                      color: '#fff',
                                      ...theme.typography.small,
                                    }}
                                  >
                                    Final
                                  </div>
                                )}
                                {isRemoving && (
                                  <div
                                    className="rounded-full px-3 py-1 text-xs font-semibold"
                                    style={{
                                      background: theme.danger,
                                      color: '#fff',
                                      ...theme.typography.small,
                                    }}
                                  >
                                    Será removido
                                  </div>
                                )}
                              </div>

                              <motion.div
                                id={`queue-${name}-node-${index}`}
                                className="flex items-center justify-center rounded-2xl border-2 font-bold text-white shadow-lg"
                                style={{
                                  width: nodeSize,
                                  height: nodeSize,
                                  fontSize,
                                  borderColor: theme.border,
                                  backgroundColor: nodeBg,
                                  transform:
                                    isActive || isRemoving
                                      ? 'scale(1.12)'
                                      : 'scale(1)',
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
                                    color: '#fff',
                                    lineHeight: 1,
                                  }}
                                >
                                  {safeValue(item)}
                                </span>
                              </motion.div>
                            </div>

                            {!isLast && (
                              <div className="flex flex-col items-center justify-center">
                                <div
                                  className="mb-2 text-xs"
                                  style={{
                                    color: theme.muted,
                                    ...theme.typography.small,
                                  }}
                                >
                                  Próximo
                                </div>

                                <svg
                                  width={Math.max(28, nodeSize)}
                                  height={Math.max(
                                    16,
                                    Math.floor(nodeSize / 2)
                                  )}
                                  viewBox="0 0 42 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  style={{ color: theme.muted }}
                                >
                                  <path
                                    d="M2 12H36"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                  />
                                  <path
                                    d="M28 5L36 12L28 19"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
