import React, { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

import "../../blockly/blocks/stackBlocks";
import "../../blockly/blocks/queueBlocks";
import "../../blockly/blocks/listBlocks";
import "../../blockly/blocks/baseBlocks";

import { javascriptGenerator } from "blockly/javascript";
import { generateC } from "../../blockly/generators/c_language/CGenerateDispatcher";

import { useTheme } from "../../theme/useTheme";
import { useError } from "../../error/useError";
import { useAuth } from "../../autenticator/useAuth";

import { saveWorkspace, loadWorkspace }
  from "../../blockly/workspaceStorage";

export default function BlocklyEditor({
  toolbox,
  setCode,
  setCCode,
  setBlockCount,
  blockCount
}) {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);
  const debounceRef = useRef(null);

  const [category, setCategory] = useState("list");
  const [initError, setInitError] = useState(false);
  const [toolboxVisible, setToolboxVisible] = useState(true);

  const [saveStatus, setSaveStatus] = useState("Salvo");

  const { theme } = useTheme();
  const { showError } = useError();
  const { user, structure } = useAuth();

  const isListToolbox = toolbox?.list;

  // 🔥 INIT WORKSPACE
  useEffect(() => {
    try {
      if (!blocklyDiv.current) return;

      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolbox?.list || toolbox,
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

      workspaceRef.current.addChangeListener((event) => {
        try {
          if (event.isUiEvent) return;
          if (!workspaceRef.current) return;

          clearTimeout(debounceRef.current);

          debounceRef.current = setTimeout(() => {
            
            try {
              if (!workspaceRef.current) return;
                setSaveStatus("Salvando...");

                saveWorkspace(workspaceRef.current, structure, user?.id);

                setTimeout(() => {
                  setSaveStatus("Salvo");
                }, 500);

              // 🔥 JS CODE
              let codeJS = "";
              try {
                codeJS =
                  javascriptGenerator.workspaceToCode(
                    workspaceRef.current
                  ) || "";

                console.log("🟡 JS GERADO:");
                console.log(codeJS);
              } catch (err) {
                showError({
                  message:
                    "Erro ao gerar código Javascript: " + err.message
                });
                return;
              }

              setCode(codeJS);

              // 🔥 C CODE
              let codeC = "";
              try {
                codeC =
                  generateC(workspaceRef.current, structure) || "";
              } catch (err) {
                showError({
                  message: "Erro ao gerar código C: " + err.message
                });
                return;
              }

              setCCode(codeC);

              // 🔥 BLOCK COUNT
              if (setBlockCount) {
                const count =
                  workspaceRef.current.getAllBlocks(false).length;
                setBlockCount(count);
              }
            } catch (err) {
              console.error("Erro ao gerar código:", err);

              showError({
                message: err.message || "Erro ao gerar código"
              });
            }
          }, 200);
        } catch (err) {
          console.error("Erro no listener do Blockly:", err);

          showError({
            message: "Erro interno no editor Blockly"
          });
        }
      });
    } catch (err) {
      console.error("Erro ao iniciar Blockly:", err);

      setInitError(true);

      showError({
        message: "Erro ao inicializar o editor"
      });
    }

    return () => {
      try {
        clearTimeout(debounceRef.current);
        workspaceRef.current?.dispose();
        workspaceRef.current = null;
      } catch (err) {
        console.warn("Erro ao destruir workspace:", err);
      }
    };
  }, [toolbox, theme.border, setCode, setCCode, setBlockCount, structure, showError, user?.id]);

  // 🔥 UPDATE TOOLBOX
  useEffect(() => {
    try {
      if (!workspaceRef.current || !toolbox?.list) return;

      if (toolboxVisible) {
        workspaceRef.current.updateToolbox(
          toolbox[category] || toolbox.list
        );
      } else {
        workspaceRef.current.updateToolbox({
          kind: "flyoutToolbox",
          contents: []
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar toolbox:", err);

      showError({
        message: "Erro ao atualizar toolbox"
      });
    }
  }, [category, toolboxVisible, toolbox, showError]);

  // 🔥 APPLY THEME
  useEffect(() => {
    try {
      if (!workspaceRef.current) return;

      const customTheme = Blockly.Theme.defineTheme(
        "custom-theme",
        {
          base: Blockly.Themes.Classic,

          blockStyles: {
            list_blocks: {
              colourPrimary: theme.blocks.list
            },
            stack_blocks: {
              colourPrimary: theme.blocks.stack
            },
            queue_blocks: {
              colourPrimary: theme.blocks.queue
            },
            logic_blocks: {
              colourPrimary: theme.blocks.logic
            }
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
        }
      );

      workspaceRef.current.setTheme(customTheme);
    } catch (err) {
      console.error("Erro ao aplicar tema:", err);

      showError({
        message: "Erro ao aplicar tema do editor"
      });
    }
  }, [showError, theme]);

  // 🔥 LOAD GENERATORS
  useEffect(() => {
    if (structure === "list") {
      import("../../blockly/generators/my_language/listGenerator");
    } else if (structure === "queue") {
      import("../../blockly/generators/my_language/queueGenerator");
    } else if (structure === "stack") {
      import("../../blockly/generators/my_language/stackGenerator");
    }
  }, [structure]);

  useEffect(() => {
    if (!workspaceRef.current) return;

    try {
      workspaceRef.current.clear();

      setSaveStatus("Restaurado");

      loadWorkspace(workspaceRef.current, structure, user?.id);

      setTimeout(() => {
        setSaveStatus("Salvo");
      }, 1500);

      if (setBlockCount) {
        const count =
          workspaceRef.current.getAllBlocks(false).length;
        setBlockCount(count);
      }
    } catch (err) {
      console.error("Erro ao carregar workspace salvo:", err);

      showError({
        message: "Erro ao restaurar os blocos salvos."
      });
    }
  }, [structure, setBlockCount, showError, user?.id]);

  // ❌ FALLBACK UI
  if (initError) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          background: theme.workspace,
          color: theme.danger
        }}
      >
        <div className="text-center">
          <h2 className="text-lg font-bold mb-2">
            ⚠️ Erro ao carregar o editor
          </h2>
          <p style={{ color: theme.muted }}>
            Tente recarregar a página
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full rounded-xl"
      style={{ background: theme.workspace }}
    >
      {/* SIDEBAR */}
      {isListToolbox && (
        <div
          className="w-14 border-r flex flex-col items-center gap-4 py-3"
          style={{
            background: theme.toolbox,
            borderColor: theme.border
          }}
        >
          <CategoryButton
            label="Lista"
            active={category === "list"}
            onClick={() => setCategory("list")}
            theme={theme}
          />

          <CategoryButton
            label="Variáveis"
            active={category === "variables"}
            onClick={() => setCategory("variables")}
            theme={theme}
          />

          <CategoryButton
            label="Condições"
            active={category === "conditions"}
            onClick={() => setCategory("conditions")}
            theme={theme}
          />

          <CategoryButton
            label="Laços"
            active={category === "loops"}
            onClick={() => setCategory("loops")}
            theme={theme}
          />

          <CategoryButton
            label="Estado"
            active={category === "state"}
            onClick={() => setCategory("state")}
            theme={theme}
          />

          <CategoryButton
            label="Ordenação"
            active={category === "sort"}
            onClick={() => setCategory("sort")}
            theme={theme}
          />
        </div>
      )}

      {/* WORKSPACE */}
      <div className="flex-1 flex flex-col">
        <div
          className="px-4 py-3 flex justify-between items-center border-b"
          style={{
            background: theme.header,
            borderColor: theme.border,
            color: theme.text
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2 rounded-full font-semibold"
              style={{
                background: theme.primary,
                color: "#fff"
              }}
            >
              Área de Programação
            </div>

            <span style={{ color: theme.muted }}>
              arraste e conecte os blocos
            </span>
          </div>

          {isListToolbox && (
            <button
              onClick={() =>
                setToolboxVisible(!toolboxVisible)
              }
              className="px-3 py-2 rounded-lg font-semibold transition"
              style={{
                background: theme.primary,
                color: "#fff"
              }}
            >
              {toolboxVisible
                ? "📂 Ocultar Blocos"
                : "📁 Mostrar Blocos"}
            </button>
          )}
        </div>

        <div className="flex-1 relative">
  {/* 💾 Status de salvamento */}
  <div
    className="absolute top-3 right-3 px-3 py-2 rounded-lg text-sm font-semibold shadow z-10"
    style={{
      background: theme.card,
      color:
        saveStatus === "Salvando..."
          ? theme.primary
          : saveStatus === "Restaurado"
          ? "#16a34a"
          : theme.text,
      border: `1px solid ${theme.border}`
    }}
  >
    {saveStatus === "Salvando..." && "💾 Salvando..."}
    {saveStatus === "Salvo" && "✅ Salvo automaticamente"}
    {saveStatus === "Restaurado" && "📂 Workspace restaurado"}
  </div>

  {/* 🧩 Contador de blocos (embaixo do status) */}
  <div
    className="absolute top-16 right-3 px-3 py-2 rounded-lg text-sm font-semibold shadow z-10"
    style={{
      background: theme.card,
      color: theme.text,
      border: `1px solid ${theme.border}`
    }}
  >
    🧩 {blockCount} blocos
  </div>

  {/* Blockly Workspace */}
  <div ref={blocklyDiv} className="h-full w-full" />
</div>
      </div>
    </div>
  );
}

// 🔥 BUTTON
function CategoryButton({
  label,
  active,
  onClick,
  theme
}) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="w-10 h-10 rounded-full transition"
        style={{
          background: active
            ? theme.primary
            : theme.hover,
          transform: active
            ? "scale(1.1)"
            : "scale(1)"
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
