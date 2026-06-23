import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../theme/useTheme";

function getNodeColor(index, theme) {
  const colors = [
    theme.primary,
    theme.success,
    theme.warning,
    "#6366F1",
    "#8B5CF6",
    "#06B6D4"
  ];
  return colors[index % colors.length];
}

// 🔒 helper seguro
function safeToString(value) {
  if (value === null || value === undefined) return "∅";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ListVisualizer({ data, step }) {
  const { theme } = useTheme();

  // 🔒 SANITIZAÇÃO GLOBAL
  const safeData =
    data && typeof data === "object" && !Array.isArray(data)
      ? data
      : {};

  const activeIndex =
    step?.type === "traverse" && typeof step.index === "number"
      ? step.index
      : null;

  const removingIndex =
    step?.type === "highlight_remove" && typeof step.index === "number"
      ? step.index
      : null;

  if (Object.keys(safeData).length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm"
        style={{ color: theme.muted }}
      >
        Nenhuma lista
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(safeData).filter(([name]) => name !== "variables").map(([name, list]) => {

        // 🔒 garante array
        const safeList = Array.isArray(list) ? list : [];

        return (
          <div key={name || "list"} className="space-y-3">

            {/* 🔥 NOME */}
            <h3
              className="text-lg font-semibold"
              style={{ color: theme.text }}
            >
              {name || "Lista"}
            </h3>

            {safeList.length === 0 ? (
              <div
                className="text-sm"
                style={{ color: theme.muted }}
              >
                Lista vazia
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="flex items-center gap-4 min-w-max py-3">

                  <AnimatePresence initial={false}>
                    {safeList.map((item, index) => {
                      const isFirst = index === 0;
                      const isLast = index === safeList.length - 1;

                      const isActive = activeIndex === index;
                      const isRemoving = removingIndex === index;

                      return (
                        <motion.div
                          key={`${name}-${index}-${safeToString(item)}`}
                          layout
                          initial={{ opacity: 0, scale: 0.7, y: -20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            scale: 0.3,
                            y: 40,
                            rotate: 10
                          }}
                          transition={{ duration: 0.35 }}
                          className="flex items-center gap-4"
                        >

                          <div className="flex flex-col items-center">

                            {/* POSIÇÃO */}
                            <div
                              className="mb-2 rounded-full px-3 py-1 text-xs font-medium"
                              style={{
                                background: theme.card,
                                color: theme.muted
                              }}
                            >
                              Posição {index}
                            </div>

                            <div className="flex flex-col items-center">

                              {/* INÍCIO */}
                              {isFirst && (
                                <div
                                  className="mb-2 rounded-full px-3 py-1 text-xs font-semibold"
                                  style={{
                                    background: theme.success,
                                    color: "#fff"
                                  }}
                                >
                                  Início
                                </div>
                              )}

                              {/* FIM */}
                              {isLast && (
                                <div
                                  className="mb-2 rounded-full px-3 py-1 text-xs font-semibold"
                                  style={{
                                    background: theme.danger,
                                    color: "#fff"
                                  }}
                                >
                                  Fim
                                </div>
                              )}

                              {/* 🔥 NODO */}
                              <div
                                className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-lg font-bold text-white shadow-lg transition-all duration-300"
                                style={{
                                  borderColor: theme.border,
                                  backgroundColor: isRemoving
                                    ? theme.danger
                                    : isActive
                                    ? theme.warning
                                    : getNodeColor(index, theme),
                                  transform:
                                    isActive || isRemoving
                                      ? "scale(1.2)"
                                      : "scale(1)"
                                }}
                              >
                                {safeToString(item)}
                              </div>

                            </div>
                          </div>

                          {/* SETA */}
                          {!isLast && (
                            <div className="flex flex-col items-center justify-center">
                              <div
                                className="text-xs font-medium mb-2"
                                style={{ color: theme.muted }}
                              >
                                Próximo
                              </div>

                              <svg
                                width="42"
                                height="24"
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