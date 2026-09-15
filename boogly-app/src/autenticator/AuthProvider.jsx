// src/autenticator/AuthProvider.jsx
import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { AppContext } from "../app_configuration/AppContext";
import { clearGuestWorkspaces } from "../blockly/workspaceStorage";
import { fetchMe } from "../services/userService";
import { authenticateUser, loginGuest, logoutUser } from "../services/authService";

export function AuthProvider({ children }) {
  const { domainUrl } = useContext(AppContext);

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // estrutura escolhida persistida
  const [structure, setStructure] = useState(() => {
    try {
      return localStorage.getItem("structure") || null;
    } catch (e) {
      return null;
    }
  });

  const setStructureSafe = (value) => {
    setStructure(value);
    try {
      if (value) localStorage.setItem("structure", value);
      else localStorage.removeItem("structure");
    } catch (e) {
      // ignore storage errors
      console.warn("[Auth] localStorage erro:", e);
    }
  };

  // fetchAndSetUser: tenta buscar /users/me via service e atualizar estado
  const fetchAndSetUser = useCallback(
    async (opts = {}) => {
      // opts pode receber { force?: true } no futuro
      if (!domainUrl) {
        // sem domainUrl não faz sentido — limpa estado
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }

      try {
        // fetchMe espera { domainUrl } (veja seu serviço)
        const data = await fetchMe({ domainUrl });

        if (!data) {
          setUser(null);
          setIsAuthenticated(false);
          return null;
        }

        setUser(data);
        setIsAuthenticated(true);
        return data;
      } catch (err) {
        console.warn("[Auth] fetchAndSetUser falhou:", err?.message || err);
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    },
    [domainUrl]
  );

  // restaura sessão ao montar o provider
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAuth(true);
      try {
        await fetchAndSetUser();
      } catch (err) {
        console.error("[Auth] erro ao restaurar sessão:", err);
      } finally {
        if (mounted) setLoadingAuth(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchAndSetUser]);

  // authenticate (email / nickname)
  async function authenticate(identifier) {
    if (!domainUrl) throw new Error("domainUrl não configurado");
    try {
      // authenticateUser faz a chamada /auth (cookie-based)
      await authenticateUser({ domainUrl, identifier });

      // atualiza usuário (cookie já foi setado pelo backend)
      await fetchAndSetUser();
      return true;
    } catch (err) {
      console.error("[Auth] authenticate erro:", err?.message || err);
      throw err;
    }
  }

  // login como convidado
  async function loginAsGuest() {
    if (!domainUrl) throw new Error("domainUrl não configurado");
    try {
      await loginGuest({ domainUrl });

      // após o backend setar cookie, buscamos o usuário
      const u = await fetchAndSetUser();
      setUser(u);
      setIsAuthenticated(!!u);
      return { user: u };
    } catch (err) {
      console.error("[Auth] loginAsGuest erro:", err?.message || err);
      throw err;
    }
  }

  // logout
  async function logout() {
    if (!domainUrl) {
      // mesmo sem domainUrl, limpamos estado local
      setUser(null);
      setIsAuthenticated(false);
      setStructure(null);
      sessionStorage.removeItem("onboarding_done");
      localStorage.removeItem("onboarding_done");
      localStorage.removeItem("structure");
      return;
    }

    try {
      // tenta chamar endpoint de logout; se não existir, apenas limpa local
      try {
        await logoutUser({ domainUrl });
      } catch (e) {
        // loga mas não quebra a limpeza local
        console.warn("[Auth] logoutUser falhou:", e?.message || e);
      }

      if (user?.guest) {
        try {
          clearGuestWorkspaces();
        } catch (e) {
          console.warn("clearGuestWorkspaces falhou:", e);
        }
      }

      // limpar local/session storage
      try {
        sessionStorage.removeItem("onboarding_done");
        localStorage.removeItem("onboarding_done");
        localStorage.removeItem("structure");
      } catch (e) {
        // ignore
      }

      // reset state
      setUser(null);
      setIsAuthenticated(false);
      setStructure(null);
    } catch (err) {
      console.error("[Auth] logout erro:", err?.message || err);
    }
  }

  const updateUser = (patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  // valor do contexto
  const contextValue = {
    user,
    isAuthenticated,
    loadingAuth,

    authenticate,
    loginAsGuest,
    logout,

    structure,
    setStructure: setStructureSafe,

    setUser: updateUser,
    refreshUser: fetchAndSetUser
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}