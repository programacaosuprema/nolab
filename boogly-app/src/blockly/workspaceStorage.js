import * as Blockly from "blockly/core";

function getWorkspaceKey(userId, structure) {
  const id = userId || "guest";
  return `blockly_workspace_${id}_${structure}`;
}

/**
 * Salva o workspace no localStorage.
 */
// workspaceStorage.js (IMPORTANTE para evitar loop infinito)
export function saveWorkspace(workspace, structure, userId) {
  if (!workspace) return;

  // 🔥 Ignora eventos internos de carregamento
  if (workspace.isLoading) return;

  try {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);

    const key = getWorkspaceKey(userId, structure);

    // 🔥 Evita salvar repetidamente o mesmo XML
    const current = localStorage.getItem(key);
    if (current === xmlText) return;

    localStorage.setItem(key, xmlText);
  } catch (error) {
    console.error("Erro ao salvar workspace:", error);
  }
}

/**
 * Carrega o workspace salvo do localStorage.
 */
// loadWorkspace()
export function loadWorkspace(workspace, structure, userId) {
  if (!workspace) return;

  const key = getWorkspaceKey(userId, structure);
  const xmlText = localStorage.getItem(key);

  if (!xmlText) return;

  try {
    workspace.isLoading = true;

    const xml = Blockly.utils.xml.textToDom(xmlText);

    Blockly.Xml.clearWorkspaceAndLoadFromXml(
      xml,
      workspace
    );

    workspace.isLoading = false;
  } catch (error) {
    workspace.isLoading = false;
    console.error("Erro ao carregar workspace:", error);
  }
}

/**
 * Remove o workspace salvo.
 */
export function clearSavedWorkspace(structure) {
  localStorage.removeItem(
    `blockly_workspace_${structure}`
  );

  console.log(`🗑️ Workspace "${structure}" removido.`);
}

export function clearGuestWorkspaces() {
  const keys = Object.keys(localStorage);

  keys.forEach((key) => {
    if (key.startsWith("blockly_workspace_guest_")) {
      localStorage.removeItem(key);
    }
  });
}