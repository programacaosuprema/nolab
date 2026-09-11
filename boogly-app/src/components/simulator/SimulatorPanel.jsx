// src/components/simulator/SimulatorPanel.jsx
import { useEffect, useState, useRef } from "react";
import ListVisualizer from "../simulator/ListVisualizer";
import StackVisualizer from "../simulator/StackVisualizer";
import QueueVisualizer from "../simulator/QueueVisualizer";
import { useTheme } from "../../theme/useTheme";
import useSimulation from "../simulator/useSimulation";
import { useAuth } from "../../autenticator/useAuth";

export default function SimulatorPanel({dslCode = ""}) {
  const { structure } = useAuth();
  const sim = useSimulation({structure});
  const { theme } = useTheme();
  const [speed, setSpeed] = useState(1);
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75];
  const safeStep = sim.steps[sim.currentStep] || {};
  const safeData = safeStep.state || {};
  
  const historyRef = useRef(null);

  const simulators = {
    list: ListVisualizer,
    stack: StackVisualizer,
    queue: QueueVisualizer
  };

const SimulatorComponent = simulators[structure] || ListVisualizer;

  const firstListName = (() => {
    try {
      const names = Object.keys(safeData || {}).filter((n) => n !== "variables");
      return names.length ? names[0] : null;
    } catch (e) {
      return null;
    }
  })();

  
  const isHorizontalStructure = structure === "list" || structure === "queue";
  const isStackStructure = structure === "stack";
  const outerSimWrapperRef = useRef(null); 
  const innerScrollWrapperRef = useRef(null);

  useEffect(() => {
    if (safeStep && safeStep.type === "traverse") return;

    const outer = outerSimWrapperRef.current;
    const inner = innerScrollWrapperRef.current;
    if (!outer && !inner) return;

    const attempts = [0, 30, 120, 300];
    attempts.forEach((delay) => {
      setTimeout(() => {
        try {
          if (isHorizontalStructure) {
            if (outer) outer.scrollLeft = 0;
            if (inner) inner.scrollLeft = 0;
          } else if (isStackStructure) {
            if (outer) outer.scrollTop = 0;
            if (inner) inner.scrollTop = 0;
          } else {
            // fallback: reset ambos eixos
            if (outer) {
              outer.scrollLeft = 0;
              outer.scrollTop = 0;
            }
            if (inner) {
              inner.scrollLeft = 0;
              inner.scrollTop = 0;
            }
          }
        } catch (e) {
          // ignore
        }
      }, delay);
    });
  }, [isHorizontalStructure, isStackStructure, safeStep, safeStep.type, structure]);


  useEffect(() => {
    if (!sim.isRunning) return;

    if (sim.currentStep >= sim.steps.length - 1) {
      sim.stop(); // ✅ correto
      return;
    }

    const baseTime = 800;
    const adjustedTime = baseTime / Math.abs(speed || 1);

    const interval = setTimeout(() => {
      sim.stepAuto(speed > 0 ? 1 : -1);
    }, adjustedTime);

    return () => clearTimeout(interval);
  }, [sim.isRunning, sim.currentStep, sim.steps.length, speed, sim]);

  useEffect(() => {
    if (!historyRef.current) return;

    const container = historyRef.current;
    const activeItem = container.children[sim.currentStep];

    if (activeItem) {
      activeItem.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [sim.currentStep]);

  
  const hasInvalidState = sim.steps.length > 0 && !sim.steps[sim.currentStep];

  if (hasInvalidState) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: theme.danger }}
      >
        ⚠️ Erro na simulação
      </div>
    );
  }
  
  if (!structure) {
    return <div>Escolha uma estrutura primeiro</div>;
  }

  return (
    <div className="flex-[3] min-h-0 rounded-xl p-4 flex flex-col gap-3 overflow-hidden" style={{ background: theme.panel }}> 
        <div className="flex items-center gap-3 flex-wrap">
            <button
            onClick={() => {
                if (!sim.isRunning && !sim.isPaused) return sim.handleRun(dslCode);
                if (sim.isRunning) return sim.handlePause();
                if (sim.isPaused) return sim.handleContinue();
            }}
            className="px-4 py-2 rounded-lg font-semibold"
            style={{ background: theme.success, color: "#fff" }}
            >
            {!sim.isRunning && !sim.isPaused && "▶ Executar"}
            {sim.isRunning && "⏸ Pausar"}
            {sim.isPaused && "▶ Continuar"}
            </button>

            <button
            onClick={sim.handleNextStep}
            className="px-4 py-2 rounded-lg font-semibold"
            style={{ background: theme.primary, color: "#fff" }}
            >
            ⏭ Passo
            </button>

            <button
            onClick={sim.handleClear}
            className="px-4 py-2 rounded-lg font-semibold"
            style={{ background: theme.danger, color: "#fff" }}
            >
            🧹 Limpar
            </button>

            {/* speed control (mantido) */}
            <div className="flex items-center gap-3 w-64 ml-auto">
            <span style={{ color: theme.text }} className="text-sm w-10">
                {speed}x
            </span>

            <input
                type="range"
                min="0"
                max={speedOptions.length - 1}
                step="1"
                value={speedOptions.indexOf(speed)}
                onChange={(e) => {
                const index = Number(e.target.value);
                setSpeed(speedOptions[index]);
                }}
                className="w-full cursor-pointer"
                style={{
                background: theme.border,
                accentColor: theme.primary
                }}
            />
            </div>
        </div>

        {/* VISUALIZAÇÃO — wrapper que foca/centraliza e limita overflow */}
        <div
            className="flex-1 min-h-0 rounded-xl p-3 border"
            style={{
            background: theme.card,
            borderColor: theme.border,
            display: "flex",
            flexDirection: "column",
            // garante que o container não empurre a coluna
            overflow: "hidden",
            boxSizing: "border-box"
            }}
        >
            {/* Inner wrapper ajustado: mostra título centralizado UMA vez e mantém o simulador responsável pela rolagem */}
            <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                alignItems: "stretch",
                justifyContent: "flex-start",
                overflow: "hidden",
                minWidth: 0
            }}
            >
            {/* -------------------------
                Nome da primeira estrutura
                (aparece apenas uma vez, centralizado)
                ------------------------- */}
            {firstListName && (
                <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: theme.spacing.sm,
                    paddingTop: theme.spacing.xs,
                    paddingBottom: theme.spacing.xs,
                    boxSizing: "border-box"
                }}
                >
                <div
                    style={{
                    display: "inline-block",
                    padding: `6px ${theme.spacing.md}`,
                    borderRadius: 8,
                    background: theme.card,
                    border: `1px solid ${theme.border}`
                    }}
                >
                    <h2
                    style={{
                        margin: 0,
                        color: theme.text,
                        ...theme.typography.h2,
                        textTransform: "none"
                    }}
                    >
                    {firstListName}
                    </h2>
                </div>
                </div>
            )}

            {/* visualizador: wrapper adaptativo por estrutura */}
            <div
                ref={outerSimWrapperRef}
                style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "flex-start",
                overflow: "hidden",
                minWidth: 0
                }}
            >
                {/* ADDED data-tour="simulator" on the inner scroll wrapper so Tour highlights the scrolling area */}
                <div
                ref={innerScrollWrapperRef}
                data-tour="simulator"
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    // para listas/filas, queremos a linha horizontal e alinhamento ao início
                    justifyContent: isHorizontalStructure ? "flex-start" : "center",
                    alignItems: isHorizontalStructure ? "center" : "flex-start",
                    overflowX: isHorizontalStructure ? "auto" : "hidden",
                    overflowY: isHorizontalStructure ? "hidden" : "auto",
                    paddingLeft: theme.spacing.sm,
                    paddingRight: theme.spacing.sm,
                    boxSizing: "border-box",
                    minWidth: 0
                }}
                >
                {/* Aqui o ajuste crítico: quando horizontal, o filho NÃO deve forçar width:100% */}
                <div
                    style={{
                    minWidth: isHorizontalStructure ? "max-content" : 0,
                    width: isHorizontalStructure ? "auto" : "100%"
                    }}
                >
                    {/* Passa showTitle={false} para evitar duplicação */}
                    <SimulatorComponent data={safeData} step={safeStep} showTitle={false} />
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* HISTÓRICO (abaixo da simulação, dentro da mesma coluna direita) */}
        {/* ADDED data-tour="history" */}
        <div
            ref={historyRef}
            data-tour="history"
            className="rounded-xl p-4 h-28 overflow-auto border"
            style={{
            background: theme.toolbox,
            borderColor: theme.border
            }}
        >
            <h3
            className="text-sm font-semibold mb-2"
            style={{ color: theme.muted }}
            >
            Histórico
            </h3>

            {sim.steps.length === 0 && (
            <p style={{ color: theme.muted }} className="text-sm">
                Nenhuma execução ainda
            </p>
            )}

            {sim.steps.slice(0, sim.currentStep + 1).map((step, i) => {
            const color =
                step.type === "add"
                ? theme.success
                : step.type === "remove"
                ? theme.danger
                : step.type === "create"
                ? theme.primary
                : theme.text;

            const symbol =
                step.type === "add"
                ? "+"
                : step.type === "remove"
                ? "-"
                : "•";

            return (
                <div
                key={i}
                className="text-sm flex gap-2 items-center px-2 py-1 rounded"
                style={{
                    background: i === sim.currentStep ? theme.hover : "transparent",
                    borderLeft: i === sim.currentStep ? `4px solid ${theme.primary}` : "none",
                    opacity: i === sim.currentStep ? 1 : 0.6
                }}
                >
                <span style={{ color }} className="font-bold">
                    {symbol}
                </span>

                <span style={{ color: theme.text }}>
                    {step.message} → {JSON.stringify(Object.values(step.state)[0] || [])}
                </span>
                </div>
            );
            })}
        </div>
    </div>
  );
}