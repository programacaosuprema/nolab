import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../theme/useTheme";
import ActionButton from "../ui/ActionButton";
import { Download, Clipboard } from "lucide-react";

export default function CodePanel({ cCode }) {
  const [language, setLanguage] = useState("c");
  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);

  const { theme } = useTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cCode || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
      setCopied(false);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([cCode || ""], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "codigo.c";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Erro ao baixar:", err);
    }
  };

  useEffect(() => {
    setCopied(false);
  }, [cCode]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: "12px"
      }}
    >
      {/* HEADER */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: theme.spacing.md,
          borderBottom: `1px solid ${theme.border}`
        }}
      >
        <div className="flex items-center" style={{ gap: theme.spacing.md }}>
          <h3
            style={{
              ...theme.typography.h3,
              color: theme.text
            }}
          >
            Código Gerado
          </h3>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              borderRadius: "6px",
              background: theme.toolbox,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              fontSize: theme.typography.small.fontSize,
              cursor: "pointer"
            }}
          >
            <option value="c">C</option>
          </select>
        </div>

        <div className="flex items-center" style={{ gap: theme.spacing.sm }}>
          <ActionButton
            onClick={handleDownload}
            icon={Download}
            variant="success"
          >
            Baixar .c
          </ActionButton>

          <ActionButton
            onClick={handleCopy}
            icon={Clipboard}
            variant="primary"
          >
            {copied ? "Copiado!" : "Copiar código"}
          </ActionButton>
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          theme={theme.editor}
          value={cCode || ""}
          onMount={(editor) => {
            editorRef.current = editor;

            // 🔥 força recalcular layout
            setTimeout(() => {
              editor.layout();
            }, 50);
          }}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "Fira Code, monospace",
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: {
              top: 12,
              bottom: 12
            }
          }}
        />
      </div>
    </div>
  );
}