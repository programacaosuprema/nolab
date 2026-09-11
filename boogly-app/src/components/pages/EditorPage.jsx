import { useState, useRef, useEffect } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";
import BlocklyEditor from "../blockly/BlocklyEditor";
import CodePanel from "../panels/CodePanel";
import { useAuth } from "../../autenticator/useAuth";
import { useTheme } from "../../theme/useTheme";
import  SimulatorPanel from "../simulator/SimulatorPanel"
import { stackToolbox, queueToolbox, toolboxCategories } from "../../blockly/toolboxes";
import { useError } from "../../error/useError";
import { javascriptGenerator } from "blockly/javascript";
import { generateC } from "../../blockly/generators/c_language/CGenerateDispatcher";

export default function EditorPage() {
  const { theme } = useTheme();
  const toolboxes = { stack: stackToolbox, queue: queueToolbox, list: toolboxCategories};
  const { structure } = useAuth();
  const currentToolbox = toolboxes[structure];
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);
  const { showError } = useError();
  const [localDslCode, setLocalDslCode] = useState("");
  const [localCCode, setLocalCCode] = useState("");
  const [localBlockCount, setLocalBlockCount] = useState(0);

  useEffect(() => {
    try {
      if (!blocklyDiv.current) return;

      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: currentToolbox,
        trashcan: true,
        collapse: true,
        grid: {
          spacing: 20,
          length: 3,
          colour: "#ccc",
          snap: true
        },
        zoom: {
          controls: true,
          wheel: true
        }
      });

      // 🔥 LISTENER
      workspaceRef.current.addChangeListener(() => {
        try {
          const ws = workspaceRef.current;
          if (!ws) return;

          // JS
          let dslCode = "";
          javascriptGenerator.init(ws);

          try {
            dslCode = javascriptGenerator.workspaceToCode(ws) || "";
            setLocalDslCode(dslCode);
          } catch (err) {
            setLocalDslCode("");
            showError({message: `Erro: ${err}`});
          }

          // C
          try {
            const codeC = generateC(ws, structure) || "";
            setLocalCCode(codeC);
          } catch (err) {
            showError({message: `Erro: ${err}`});
            setLocalCCode("");
          }

          // block count
          const count = ws.getAllBlocks(false).length;
          setLocalBlockCount(count);

        } catch (err) {
          console.error("Erro no listener:", err);
        }
      });

    } catch (err) {
      console.error("Erro ao iniciar editor:", err);
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
  }, [currentToolbox, showError, structure]);

  if (!structure) {
    return <div>Escolha uma estrutura primeiro</div>;
  }

  return (
    <div className="flex flex-col h-full gap-3" style={{ background: theme.background }}>
      <div className="flex flex-1 min-h-0 gap-3">
  
        <section data-tour="editor" className="w-1/2 min-h-0 rounded-xl overflow-hidden" style={{ background: theme.workspace }}>
          <BlocklyEditor
            toolbox={currentToolbox}
            setCode={setLocalDslCode}
            setCCode={setLocalCCode}
            setBlockCount={setLocalBlockCount}
            blockCount={localBlockCount}
          />
        </section>
        
        <section className="w-1/2 min-h-0 flex flex-col gap-3">
            <SimulatorPanel dslCode={localDslCode} />
    
          <div data-tour="code" className="h-56 rounded-xl overflow-hidden" style={{ background: theme.panel }}>
            <CodePanel cCode={localCCode} />
          </div>
        </section>

      </div>
    </div>
  );
}