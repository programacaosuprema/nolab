// src/components/visualizers/ListVisualizer.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../../theme/useTheme';

function getNodeColor(index, theme) {
  const colors = [
    theme?.primary ?? '#3B82F6',
    theme?.success ?? '#16A34A',
    theme?.warning ?? '#F59E0B',
    '#6366F1',
    '#8B5CF6',
    '#06B6D4',
  ];
  return colors[index % colors.length];
}

function getNodeSize(length) {
  if (length <= 5) return 64;
  if (length <= 8) return 52;
  if (length <= 12) return 42;
  return 34;
}

function safeToString(value) {
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

export default function ListVisualizer({ data, step }) {
  const { theme } = useTheme();
  const containerRefs = useRef({});

  const safeData =
    data && typeof data === 'object' && !Array.isArray(data) ? data : {};

  const activeIndex =
    step?.type === 'traverse' && typeof step.index === 'number'
      ? step.index
      : null;

  const removingIndex =
    step?.type === 'highlight_remove' && typeof step.index === 'number'
      ? step.index
      : null;

  // scrollIntoView só quando há activeIndex
  useEffect(() => {
    if (activeIndex === null) return;
    const el = document.getElementById(`node-active-${activeIndex}`);
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeIndex]);

  // rotina robusta para resetar scroll ao início quando NÃO houver activeIndex
  useEffect(() => {
    if (activeIndex !== null) return;

    // Small helper: attempt multiple times to reset, to avoid racing with animations/layout
    const attempts = [0, 40, 120, 300];
    const refs = Object.values(containerRefs.current).filter(Boolean);

    refs.forEach((container) => {
      attempts.forEach((delay) => {
        setTimeout(() => {
          try {
            // prefer scrollTo API
            container.scrollTo({ left: 0, behavior: 'auto' });
          } catch (e) {
            // fallback diretto
            container.scrollLeft = 0;
          }
        }, delay);
      });
    });

    // cleanup not needed for timeouts (they will fire), no handles returned
  }, [JSON.stringify(safeData), activeIndex]);

  if (!safeData || Object.keys(safeData).length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm"
        style={{
          color: theme?.muted,
          fontSize: theme?.typography?.body?.fontSize,
        }}
      >
        Nenhuma lista
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-8"
      style={{
        color: theme?.text,
        fontSize: theme?.typography?.body?.fontSize,
      }}
    >
      {Object.entries(safeData)
        .filter(([name]) => name !== 'variables')
        .map(([name, list]) => {
          const safeList = Array.isArray(list) ? list : [];
          const nodeSize = getNodeSize(safeList.length);
          const gap = nodeSize < 50 ? 8 : 16;
          const fontSize = Math.max(12, Math.floor(nodeSize / 3));
          const paddingInline =
            typeof theme?.spacing?.sm === 'string'
              ? parseInt(theme.spacing.sm) || 12
              : (theme?.spacing?.sm ?? 12);

          return (
            <div key={name || 'list'} className="space-y-3">
              <h3
                className="text-lg font-semibold"
                style={{
                  color: theme?.text,
                  ...theme?.typography?.h3,
                }}
              >
                {name || 'Lista'}
              </h3>

              {safeList.length === 0 ? (
                <div
                  className="text-sm"
                  style={{
                    color: theme?.muted,
                    ...theme?.typography?.small,
                  }}
                >
                  Lista vazia
                </div>
              ) : (
                <div
                  // armazena o ref dessa lista por nome
                  ref={(el) => (containerRefs.current[name] = el)}
                  className="w-full overflow-x-auto"
                  style={{
                    scrollSnapType: 'x mandatory',
                    // importante: garante que padding esquerdo não "esconda" o primeiro item
                    scrollPaddingInlineStart: `${paddingInline}px`,
                    paddingBottom: theme?.spacing?.sm,
                  }}
                >
                  <div
                    className="flex items-center min-w-max py-3"
                    style={{
                      gap,
                      alignItems: 'flex-start',
                      paddingLeft: theme?.spacing?.sm,
                      paddingRight: theme?.spacing?.sm,
                      justifyContent: 'flex-start', // força início visível
                    }}
                  >
                    <AnimatePresence initial={false}>
                      {safeList.map((item, index) => {
                        const isFirst = index === 0;
                        const isLast = index === safeList.length - 1;
                        const isActive = activeIndex === index;
                        const isRemoving = removingIndex === index;

                        const nodeBg = isRemoving
                          ? theme?.danger
                          : isActive
                            ? theme?.warning
                            : getNodeColor(index, theme);

                        return (
                          <motion.div
                            key={`${name}-${index}-${safeToString(item)}`}
                            layout
                            initial={{ opacity: 0, scale: 0.8, y: -8 }}
                            animate={{
                              opacity: 1,
                              scale: isActive || isRemoving ? 1.15 : 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.4,
                              y: 30,
                              rotate: 6,
                            }}
                            transition={{ duration: 0.28 }}
                            className="flex items-center gap-4"
                            style={{
                              // troquei para 'start' para o primeiro item ficar alinhado ao início
                              scrollSnapAlign: 'start',
                            }}
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className="mb-2 rounded-full px-3 py-1 text-xs font-medium"
                                style={{
                                  background: theme?.card,
                                  color: theme?.muted,
                                  ...theme?.typography?.small,
                                }}
                              >
                                Posição {index}
                              </div>

                              <div className="flex flex-col items-center">
                                {isFirst && (
                                  <div
                                    className="mb-2 rounded-full px-3 py-1 text-xs font-semibold"
                                    style={{
                                      background: theme?.success,
                                      color: '#fff',
                                      ...theme?.typography?.small,
                                    }}
                                  >
                                    Início
                                  </div>
                                )}

                                {isLast && (
                                  <div
                                    className="mb-2 rounded-full px-3 py-1 text-xs font-semibold"
                                    style={{
                                      background: theme?.danger,
                                      color: '#fff',
                                      ...theme?.typography?.small,
                                    }}
                                  >
                                    Fim
                                  </div>
                                )}

                                <div
                                  id={`node-active-${index}`}
                                  className="flex items-center justify-center rounded-2xl border-2 font-bold text-white shadow-lg transition-all duration-200"
                                  style={{
                                    width: nodeSize,
                                    height: nodeSize,
                                    fontSize,
                                    borderColor: theme?.border,
                                    backgroundColor: nodeBg,
                                    transform:
                                      isActive || isRemoving
                                        ? 'scale(1.15)'
                                        : 'scale(1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    padding: 6,
                                    boxSizing: 'border-box',
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
                                    {safeToString(item)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {!isLast && (
                              <div className="flex flex-col items-center justify-center">
                                <div
                                  className="text-xs font-medium mb-2"
                                  style={{
                                    color: theme?.muted,
                                    ...theme?.typography?.small,
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
                                  style={{ color: theme?.muted }}
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
