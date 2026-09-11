// src/hooks/useBlocklyWorkspace.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import "blockly/javascript"; // importa o gerador (side-effect)

export function useBlocklyWorkspace({
  blocklyDivRef,
  toolbox,
  propStructure,
  javascriptGenerator, // opcional: pode ser passado (não obrigatório)
  generateC,
  saveWorkspace = null,
  userId = null,
  onInit = null
}) {
  const workspaceRef = useRef(null);
  const debounceRef = useRef(null);

  const [DSLCode, setDSLCode] = useState("");
  const [cCode, setCCode] = useState("");
  const [blockCount, setBlockCount] = useState(0);
  const [initError, setInitError] = useState(false);

  // helper to safely call generateC
  const tryGenerateC = useCallback((ws, structure) => {
    try {
      if (!generateC) return "";
      return generateC(ws, structure);
    } catch (err) {
      console.warn("generateC falhou:", err);
      return "";
    }
  }, [generateC]);

  useEffect(() => {
    try {
      if (!blocklyDivRef?.current) return;

      const Blockly = window.Blockly;
      if (!Blockly) {
        console.error("Blockly não encontrado em window.Blockly — verifique import / script.");
        setInitError(true);
        return;
      }

      // inject workspace
      workspaceRef.current = Blockly.inject(blocklyDivRef.current, {
        toolbox,
        trashcan: true,
        collapse: true,
        grid: { spacing: 20, length: 3, colour: "#ddd", snap: true },
        zoom: { controls: true, wheel: true }
      });

      onInit?.(workspaceRef.current);

      workspaceRef.current.addChangeListener((event) => {
        try {
          if (event.isUiEvent) return;
          if (!workspaceRef.current) return;

          clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            try {
              const ws = workspaceRef.current;

              // --- SELECT JS GENERATOR (prioriza argumento, senão window.Blockly.JavaScript)
              const JSGen = javascriptGenerator || (window.Blockly && window.Blockly.JavaScript);

              // Garante que exista
              let js = "";
              if (JSGen) {
                try {
                  // init CAN be required for some custom generator implementations
                  if (typeof JSGen.init === "function") {
                    try { JSGen.init(ws); } catch(e) { /* swallow but log */ console.warn("JSGen.init falhou:", e); }
                  }
                  if (typeof JSGen.workspaceToCode === "function") {
                    js = JSGen.workspaceToCode(ws) || "";
                  } else if (window.Blockly?.JavaScript && typeof window.Blockly.JavaScript.workspaceToCode === "function") {
                    js = window.Blockly.JavaScript.workspaceToCode(ws) || "";
                  }
                } catch (err) {
                  console.warn("Erro gerando JS:", err);
                  js = "";
                }
              } else {
                console.warn("Nenhum generator JS disponível (javascriptGenerator ou window.Blockly.JavaScript)");
                js = "";
              }

              // C generator (igual antes)
              let c = "";
              try {
                c = tryGenerateC(ws, propStructure) || "";
              } catch (err) {
                console.warn("Erro gerando C:", err);
                c = "";
              }

              // set states
              setDSLCode(String(js || ""));
              setCCode(String(c || ""));

              // block count
              const count = ws.getAllBlocks(false)?.length || 0;
              setBlockCount(count);

              // autosave opcional
              if (saveWorkspace) saveWorkspace(ws, propStructure, userId);
            } catch (err) {
              console.error("Erro no debounce listener:", err);
            }
          }, 180);
        } catch (err) {
          console.error("Erro no change listener do Blockly:", err);
        }
      });

      setInitError(false);
    } catch (err) {
      console.error("Erro ao iniciar Blockly:", err);
      setInitError(true);
    }

    return () => {
      try {
        if (workspaceRef.current) {
          workspaceRef.current.dispose();
          workspaceRef.current = null;
        }
      } catch (err) {
        console.warn("Erro ao destruir workspace:", err);
      }
      clearTimeout(debounceRef.current);
    };
  }, [blocklyDivRef, toolbox, propStructure, javascriptGenerator, generateC, saveWorkspace, userId, onInit, tryGenerateC]);

  const overwriteCCode = useCallback((val) => setCCode(val), []);
  return { DSLCode, cCode, blockCount, workspaceRef, initError, setCCode: overwriteCCode };
}

export default useBlocklyWorkspace;