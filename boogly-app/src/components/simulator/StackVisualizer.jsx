import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../theme/useTheme";

// 🔒 cores seguras
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

// 🔒 valor seguro
function safeValue(value) {
  if (value === null || value === undefined) return "∅";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function StackVisualizer({ data }) {
  const { theme } = useTheme();

  // 🔒 sanitização global
  const safeData =
    data && typeof data === "object" && !Array.isArray(data) 
      ? data
      : {};

  if (Object.keys(safeData).length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm"
        style={{ color: theme.muted }}
      >
        Nenhuma pilha
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 items-center">
      {Object.entries(safeData).filter(([name]) => name !== "variables").map(([name, stack]) => {

        // 🔒 garante array
        const safeStack = Array.isArray(stack) ? stack : [];

        return (
          <div key={name || "stack"} className="space-y-3 flex flex-col items-center">

            {/* 🔤 NOME */}
            <h3
              className="text-lg font-semibold"
              style={{ color: theme.text }}
            >
              {name || "Pilha"}
            </h3>

            {/* 🚫 VAZIO */}
            {safeStack.length === 0 ? (
              <div
                className="text-sm"
                style={{ color: theme.muted }}
              >
                Pilha vazia
              </div>
            ) : (

              <div className="flex flex-col-reverse items-center gap-4">

                <AnimatePresence initial={false}>
                  {safeStack.map((item, index) => {
                    const isTop = index === safeStack.length - 1;

                    return (
                      <motion.div
                        key={`${name}-${index}-${safeValue(item)}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 10 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-3"
                      >

                        {/* 📍 POSIÇÃO */}
                        <div
                          className="text-xs w-16 text-right"
                          style={{ color: theme.muted }}
                        >
                          Posição {index}
                        </div>

                        {/* 🧱 BLOCO */}
                        <div className="flex flex-col items-center">

                          {/* 🔝 TOPO */}
                          {isTop && (
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="mb-2 px-3 py-1 text-xs font-semibold rounded-full"
                              style={{
                                background: `${theme.primary}20`,
                                color: theme.primary,
                                border: `1px solid ${theme.primary}`
                              }}
                            >
                              Topo
                            </motion.div>
                          )}

                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-lg font-bold shadow-lg"
                            style={{
                              background: getNodeColor(index, theme),
                              color: "#fff",
                              borderColor: theme.background
                            }}
                          >
                            {safeValue(item)}
                          </motion.div>

                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}