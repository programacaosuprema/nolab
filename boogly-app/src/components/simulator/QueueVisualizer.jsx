import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../theme/useTheme";

function getNodeColor(index, theme) {
  const palette = [
    theme.primary,
    theme.success,
    theme.warning,
    theme.danger,
    theme.blocks?.structure,
    theme.blocks?.logic
  ].filter(Boolean);

  return palette[index % palette.length];
}

function safeValue(value) {
  if (value === null || value === undefined) return "∅";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function QueueVisualizer({ data, step }) {
  const { theme } = useTheme();

  const safeData =
    data && typeof data === "object" && !Array.isArray(data) ? data : {};

  const activeIndex =
    step?.type === "traverse" && typeof step.index === "number"
      ? step.index
      : null;

  // Só destaca a remoção no passo de pré-remoção
  const isHighlightRemove = step?.type === "highlight_remove";

  if (Object.keys(safeData).length === 0) {
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
    <div className="flex flex-col gap-8">
      {Object.entries(safeData).filter(([name]) => name !== "variables").map(([name, queue]) => {
        const safeQueue = Array.isArray(queue) ? queue : [];

        // Só existe destaque vermelho no passo de highlight_remove
        // No dequeue/update a fila já deve aparecer no estado final
        const removingIndex = isHighlightRemove && safeQueue.length > 0 ? 0 : null;

        return (
          <div key={name || "queue"} className="space-y-3">
            <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
              {name || "Fila"}
            </h3>

            {safeQueue.length === 0 ? (
              <div className="text-sm" style={{ color: theme.muted }}>
                Fila vazia
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="flex min-w-max items-center gap-4 py-3">
                  <AnimatePresence initial={false}>
                    {safeQueue.map((item, index) => {
                      const isFirst = index === 0;
                      const isLast = index === safeQueue.length - 1;
                      const isActive = activeIndex === index;
                      const isRemoving = removingIndex === index;

                      return (
                        <motion.div
                          key={`${name}-${index}-${safeValue(item)}`}
                          layout
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{
                            opacity: 1,
                            scale: isRemoving ? 1.1 : 1,
                            y: 0
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            y: 30
                          }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-4"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className="mb-2 rounded-full px-3 py-1 text-xs"
                              style={{
                                background: theme.card,
                                color: theme.muted,
                                border: `1px solid ${theme.border}`
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
                                    color: "#fff"
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
                                    color: "#fff"
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
                                    color: "#fff"
                                  }}
                                >
                                  Será removido
                                </div>
                              )}
                            </div>

                            <motion.div
                              className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-lg font-bold text-white shadow-lg"
                              style={{
                                borderColor: theme.background,
                                backgroundColor: isRemoving
                                  ? theme.danger
                                  : isActive
                                  ? theme.warning
                                  : getNodeColor(index, theme)
                              }}
                            >
                              {safeValue(item)}
                            </motion.div>
                          </div>

                          {!isLast && (
                            <div className="flex flex-col items-center">
                              <div
                                className="mb-2 text-xs"
                                style={{ color: theme.muted }}
                              >
                                Próximo
                              </div>
                              <span style={{ color: theme.muted }}>→</span>
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