import * as Blockly from 'blockly/core';

/* ==========================================================
   🔹 HELPERS
========================================================== */

function getWorkspaceKey(userId, structure) {
  const id = userId || 'guest';
  return `blockly_workspace_${id}_${structure}`;
}

function isStorageAvailable() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function handleError(error, onError, message) {
  const err = {
    message: message || 'Erro no workspace',
    type: 'storage',
    original: error,
  };

  // envia pra UI (ErrorToast / ErrorPage)
  if (typeof onError === 'function') {
    onError(err);
  }

  // debug (somente dev)
  if (import.meta.env.DEV) {
    console.error('[workspaceStorage]', error);
  }
}

/* ==========================================================
   🔹 SAVE
========================================================== */
export function saveWorkspace(workspace, structure, userId, onError) {
  if (!workspace) return false;

  if (workspace.isLoading) return false;

  try {
    const blocks = workspace.getAllBlocks(false);
    if (!blocks || blocks.length === 0) return false;
  } catch (err) {
    handleError(err, onError, 'Erro ao ler blocos do workspace');
    return false;
  }

  if (!isStorageAvailable()) {
    handleError(null, onError, 'localStorage indisponível');
    return false;
  }

  try {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);

    const key = getWorkspaceKey(userId, structure);

    const current = localStorage.getItem(key);
    if (current === xmlText) return false;

    localStorage.setItem(key, xmlText);

    return true;
  } catch (err) {
    handleError(err, onError, 'Erro ao salvar workspace');
    return false;
  }
}

/* ==========================================================
   🔹 LOAD
========================================================== */
export function loadWorkspace(workspace, structure, userId, onError) {
  if (!workspace) return false;

  if (!isStorageAvailable()) return false;

  const key = getWorkspaceKey(userId, structure);
  const xmlText = localStorage.getItem(key);

  if (!xmlText) return false;

  try {
    workspace.isLoading = true;

    const xml = Blockly.utils.xml.textToDom(xmlText);
    Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, workspace);

    workspace.isLoading = false;

    return true;
  } catch (err) {
    workspace.isLoading = false;
    handleError(err, onError, 'Erro ao carregar workspace');
    return false;
  }
}

/* ==========================================================
   🔹 CLEAR (estrutura específica)
========================================================== */
export function clearSavedWorkspace(structure, userId, onError) {
  if (!isStorageAvailable()) return false;

  try {
    const key = getWorkspaceKey(userId, structure);
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    handleError(err, onError, 'Erro ao limpar workspace');
    return false;
  }
}

/* ==========================================================
   🔹 CLEAR GUEST
========================================================== */
export function clearGuestWorkspaces(onError) {
  if (!isStorageAvailable()) return false;

  try {
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith('blockly_workspace_guest_')) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (err) {
    handleError(err, onError, 'Erro ao limpar workspaces guest');
    return false;
  }
}