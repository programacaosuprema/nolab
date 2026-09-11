import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

// blocos (igual ao principal)
import "../../blockly/blocks/stackBlocks";
import "../../blockly/blocks/queueBlocks";
import "../../blockly/blocks/listBlocks";
import "../../blockly/blocks/baseBlocks";

import { javascriptGenerator } from "blockly/javascript";
import { generateC } from "../../blockly/generators/c_language/CGenerateDispatcher";

import { useTheme } from "../../theme/useTheme";
import { useError } from "../../error/useError";

import CodePanel from "../panels/CodePanel";

import SimulatorPanel from "../simulator/SimulatorPanel";

function CategoryButton({ label, active, onClick, theme }) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="w-10 h-10 rounded-full transition"
        style={{
          background: active ? theme.primary : theme.hover,
          transform: active ? "scale(1.06)" : "scale(1)"
        }}
      />
      <span
        className="absolute left-12 top-1/2 -translate-y-1/2
                   text-xs px-2 py-1 rounded whitespace-nowrap
                   opacity-0 group-hover:opacity-100 transition pointer-events-none z-50"
        style={{
          background: theme.panel,
          color: theme.text,
          border: `1px solid ${theme.border}`
        }}
      >
        {label}
      </span>
    </div>
  );
}

function detectStructureFromToolbox(toolbox) {
  if (!toolbox) return "list";
  if (toolbox.list) return "list";
  if (toolbox.queue) return "queue";
  if (toolbox.stack) return "stack";
  return "list";
}

function getToolboxForCategory(toolbox, category) {
  if (!toolbox) return null;
  return toolbox[category] || toolbox.list || toolbox.queue || toolbox.stack || toolbox;
}

/** Resolves a numeric value from a child block (tries common field names) */
function resolveValueFromBlock(block) {
  if (!block) return null;
  // common numeric field names used in your blocks
  const candidates = ["VALUE", "NUM", "NUMBER", "VALUE_NUM", "VAL"];
  for (const f of candidates) {
    try {
      const v = block.getFieldValue?.(f);
      if (v !== undefined && v !== null) {
        const n = Number(v);
        return Number.isNaN(n) ? v : n;
      }
    } catch (e) {}
  }

  // if the child is a literal number shadow with field "NUM" etc:
  const fields = block.inputList?.flatMap(i =>
    (i.fieldRow || []).map(f => f && f.name && block.getFieldValue?.(f.name))
  ) || [];
  for (const val of fields) {
    if (val !== undefined) {
      const n = Number(val);
      if (!Number.isNaN(n)) return n;
    }
    }

  // fallback: try to generate JS and parse number
  try {
    const js = javascriptGenerator.blockToCode(block);
    const matched = js && js.match(/-?\d+/);
    if (matched) return Number(matched[0]);
  } catch (e) {}

  return null;
}

/** Extrai a sequência de comandos respeitando ligações VALUE / inputs */
function extractCommandsFromWorkspace(ws) {
  const commands = [];

  function walk(block) {
    if (!block) return;

    const type = block.type;

    let value = null;

    try {
      value =
        block.getFieldValue?.("VALUE") ??
        block.getFieldValue?.("NUM") ??
        null;

      if (value !== null) {
        const n = Number(value);
        if (!Number.isNaN(n)) value = n;
      }
    } catch (e) {}

    // tenta pegar valor de input conectado
    if (value === null) {
      const inputs = block.inputList || [];

      for (const input of inputs) {
        const target = input.connection?.targetBlock();

        if (target) {
          const resolved = resolveValueFromBlock(target);
          if (resolved !== null) {
            value = resolved;
            break;
          }
        }
      }
    }
    

    // 🚀 salva comando
    commands.push({ type, value });

    // 🔥 1. percorre inputs (filhos internos)
    const inputs = block.inputList || [];

    for (const input of inputs) {
      const child = input.connection?.targetBlock();

      if (child) {
        walk(child);
      }
    }

    // 🔥 2. percorre próximo bloco da cadeia
    const next = block.getNextBlock?.();
    if (next) walk(next);
  }

  const topBlocks = ws.getTopBlocks(true);

  topBlocks.forEach((block) => walk(block));

  return commands;
}

export default function ChallengeBlocklyEditor({toolbox, structure: propStructure, setBlockCount, onRun: onRun}) {

  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);

  const { theme } = useTheme();
  const { showError } = useError();

  const [category, setCategory] = useState(null);
  const [toolboxVisible, setToolboxVisible] = useState(true);
  const [blockCountLocal, setBlockCountLocal] = useState(0);
  const [view, setView] = useState("editor"); 
  const [localCCode, setLocalCCode] = useState("");
  const [localDSLCode, setLocalDSLCode] = useState("");

  const detectedStructure = propStructure || detectStructureFromToolbox(toolbox);

  const [isRunning, setIsRunning] = useState(false);

  const categoriesByStructure = {
    list: [
      ["list", "Lista"],
      ["variables", "Variáveis"],
      ["conditions", "Condições"],
      ["loops", "Laços"],
      ["state", "Estado"],
      ["sort", "Ordenação"]
    ],
    queue: [
      ["queue", "Fila"],
      ["variables", "Variáveis"],
      ["conditions", "Condições"],
      ["state", "Estado"],
      ["loops", "Laços"]
    ],
    stack: [
      ["stack", "Pilha"],
      ["variables", "Variáveis"],
      ["conditions", "Condições"],
      ["state", "Estado"],
      ["loops", "Laços"]
    ]
  };

  useEffect(() => {
    // init workspace once
    try {
      if (!blocklyDiv.current) return;

      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolbox?.list || toolbox?.queue || toolbox?.stack || toolbox,
        trashcan: true,
        collapse: true,
        grid: {
          spacing: 20,
          length: 3,
          colour: theme.border,
          snap: true
        },
        zoom: {
          controls: true,
          wheel: true
        }
      });

      // change listener (no autosave)
      workspaceRef.current.addChangeListener(() => {
        try {
          const ws = workspaceRef.current;
          if (!ws) return;

          // JS
          let dslCode = "";
          javascriptGenerator.init(ws);
          try {

           dslCode = javascriptGenerator.workspaceToCode(ws) || "";
            setLocalDSLCode(dslCode)
          } catch (err) {
            console.log(err);
           
          }

          try {
            const codeC = generateC(ws, propStructure) || "";
            setLocalCCode(codeC);
          } catch (err) {
             console.log(err);
          }

          // block count
          const count = ws.getAllBlocks(false).length;
          setBlockCount && setBlockCount(count);
          setBlockCountLocal(count);
        } catch (err) {
          console.error("Erro no change listener:", err);
        }
      });
    } catch (err) {
      console.error("Erro ao iniciar editor:", err);
      setBlockCount && setBlockCount(0);
      showError({ message: "Erro ao iniciar editor" });
    }

    return () => {
      try {
        workspaceRef.current?.dispose();
        workspaceRef.current = null;
      } catch (err) {
        console.warn("Erro ao destruir workspace:", err);
      }
    };
    // only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update theme
  useEffect(() => {
    try {
      if (!workspaceRef.current) return;
      const customTheme = Blockly.Theme.defineTheme("challenge-theme", {
        base: Blockly.Themes.Classic,
        blockStyles: {
          list_blocks: { colourPrimary: theme.blocks?.list || "#1f9" },
          stack_blocks: { colourPrimary: theme.blocks?.stack || "#9f1" },
          queue_blocks: { colourPrimary: theme.blocks?.queue || "#19f" },
          logic_blocks: { colourPrimary: theme.blocks?.logic || "#f19" }
        },
        componentStyles: {
          workspaceBackgroundColour: theme.workspace,
          toolboxBackgroundColour: theme.toolbox,
          toolboxForegroundColour: theme.text,
          flyoutBackgroundColour: theme.toolbox,
          flyoutForegroundColour: theme.text,
          scrollbarColour: theme.border,
          insertionMarkerColour: theme.primary,
          insertionMarkerOpacity: 0.3,
          cursorColour: theme.primary
        }
      });
      workspaceRef.current.setTheme(customTheme);
    } catch (err) {
      console.warn("Erro ao aplicar tema:", err);
    }
  }, [theme]);

  // update toolbox when category changes
  useEffect(() => {
    try {
      if (!workspaceRef.current) return;

      // 🔴 OCULTAR TOOLBOX
      if (!toolboxVisible) {
        workspaceRef.current.updateToolbox({
          kind: "flyoutToolbox",
          contents: []
        });
        return;
      }

      // 🟢 MOSTRAR TOOLBOX
      const nextToolbox = getToolboxForCategory(toolbox, category);

      if (!nextToolbox || !nextToolbox.contents) return;

      workspaceRef.current.updateToolbox(nextToolbox);

    } catch (err) {
      console.error("Erro ao atualizar toolbox:", err);
      showError({ message: "Erro ao atualizar toolbox" });
    }
  }, [category, toolboxVisible, toolbox, showError]);

  // set initial category from structure
  useEffect(() => {
    setCategory(detectedStructure);
  }, [detectedStructure]);

  // LOAD generators by structure (dynamic imports like main editor)
  useEffect(() => {
    if (detectedStructure === "list") {
      import("../../blockly/generators/my_language/listGenerator").catch(() => {});
    } else if (detectedStructure === "queue") {
      import("../../blockly/generators/my_language/queueGenerator").catch(() => {});
    } else if (detectedStructure === "stack") {
      import("../../blockly/generators/my_language/stackGenerator").catch(() => {});
    }
  }, [detectedStructure]);

  async function handleRun() {
    try {
      if (!workspaceRef.current) return;
      setIsRunning(true);
      const ws = workspaceRef.current;

      // extrai comandos
      const commands = extractCommandsFromWorkspace(ws);

      await onRun?.(commands);
    } catch (err) {
      showError({ message: err.message || "Erro ao executar" });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div
      className="flex h-full w-full rounded-xl"
      style={{
        background: theme.workspace,
        color: theme.text,
        fontSize: theme.typography.body.fontSize
      }}
    >
      {/* SIDEBAR */}
      <div
        className="flex flex-col items-center"
        style={{
          width: "56px",
          gap: theme.spacing.sm,
          padding: theme.spacing.sm,
          background: theme.toolbox,
          borderRight: `1px solid ${theme.border}`
        }}
      >
        {(categoriesByStructure[detectedStructure] || []).map(([key, label]) => (
          <CategoryButton
            key={key}
            label={label}
            active={category === key}
            onClick={() => {
              if (view !== "editor") return; // 🔥 trava
              setCategory(key);
            }}
            theme={theme}
          />
        ))}
      </div>

      {/* WORKSPACE + HEADER */}
      <div className="flex-1 flex flex-col">
        
        {/* HEADER */}
        <div
          className="flex justify-between items-center"
          style={{
            padding: theme.spacing.md,
            background: theme.header,
            borderBottom: `1px solid ${theme.border}`,
            color: theme.text
          }}
        >
          <div className="flex items-center" style={{ gap: theme.spacing.md }}>
            <div style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: "999px",
              background: theme.primary,
              color: "#fff",
              ...theme.typography.h3
            }}>
              Área de Programação
            </div>

            {/* 🔥 NOVO TOGGLE */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setView("editor")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: view === "editor" ? theme.primary : theme.card,
                  color: view === "editor" ? "#fff" : theme.text,
                  border: `1px solid ${theme.border}`,
                  cursor: "pointer"
                }}
              >
                🧱 Editor
              </button>

              <button
                onClick={() => setView("code")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: view === "code" ? theme.primary : theme.card,
                  color: view === "code" ? "#fff" : theme.text,
                  border: `1px solid ${theme.border}`,
                  cursor: "pointer"
                }}
              >
                💻 Código
              </button>

              <button
                onClick={() => setView("simulation")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: view === "simulation" ? theme.primary : theme.card,
                  color: view === "simulation" ? "#fff" : theme.text,
                  border: `1px solid ${theme.border}`,
                  cursor: "pointer"
                }}
              >
                ▶ Simulação
              </button>
            </div>
          </div>

          { view === "editor" && (
            <div className="flex items-center" style={{ gap: theme.spacing.sm }}>
              <button
                onClick={() => setToolboxVisible(!toolboxVisible)}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: "8px",
                  background: theme.primary,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {toolboxVisible ? "📂 Ocultar Blocos" : "📁 Mostrar Blocos"}
              </button>

              <button
                onClick={handleRun}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  borderRadius: "8px",
                  background: theme.primary,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {isRunning ? "Executando..." : "▶ Testar solução"}
              </button>
              
            </div>
            
          )}
          
        </div>

        <div className="flex-1 relative">
          { view === "editor" && (
            <div
              style={{
                position: "absolute",
                top: theme.spacing.sm,
                right: theme.spacing.sm,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: "8px",
                background: theme.card,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                zIndex: 50,
                ...theme.typography.small
              }}>
              🧩 {blockCountLocal} blocos
            </div>
          )};
          
          <div className={`absolute inset-0 ${ view === "editor" ? "block" : "hidden"}`}>
            <div ref={blocklyDiv} className="h-full w-full" />
          </div>

          <div className={`absolute inset-0 ${ view === "code" ? "block" : "hidden"}`}>
            <CodePanel cCode={localCCode} />
          </div>
          
          <div className={`absolute inset-0 ${view === "simulation" ? "block" : "hidden"}`}>
            <SimulatorPanel dslCode={localDSLCode}/>
          </div>
          
        </div>
      </div>
    </div>
  );
}