// src/autenticator/AuthProvider.jsx
import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { AppContext } from "../app_configuration/AppContext";
import { clearGuestWorkspaces } from "../utils/workspaceStorage";
import { fetchMe } from "../services/userService";
import {
  authenticateUser,
  loginGuest,
  logoutUser,
} from "../services/authService";

// hooks / util de erro (assegure que ErrorProvider envolve este provider no index)
import { useError } from "../error/hooks/useError";
import { normalizeError } from "../error/utils/normalizeError";

export function AuthProvider({ children }) {
  const { domainUrl } = useContext(AppContext);

  const { showError } = useError(); // disponível porque ErrorProvider envolve a árvore
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // estrutura escolhida persistida
  const [structure, setStructure] = useState(() => {
    try {
      return localStorage.getItem("structure") || null;
    } catch (e) {
      // não quebrar caso storage esteja inacessível
      console.warn("[Auth] localStorage inacessível:", e?.message || e);
      return null;
    }
  });

  const setStructureSafe = (value) => {
    setStructure(value);
    try {
      if (value) localStorage.setItem("structure", value);
      else localStorage.removeItem("structure");
    } catch (e) {
      console.warn("[Auth] erro ao gravar structure:", e?.message || e);
    }
  };

  /**
   * fetchAndSetUser
   * - opts.silent: se true, falhas não são mostradas via UI (útil no restore inicial)
   */
  const fetchAndSetUser = useCallback(
    async (opts = { silent: true }) => {
      if (!domainUrl) {
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }

      try {
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
        // mantém um log para devs, mas só mostra ao usuário se silent === false
        console.warn("[Auth] fetchMe falhou:", err?.message || err);
        setUser(null);
        setIsAuthenticated(false);

        if (!opts.silent) {
          try {
            showError(normalizeError(err));
          } catch (e) {
            // se showError não existir por algum motivo, logamos
            console.error("[Auth] showError falhou:", e);
          }
        }

        return null;
      }
    },
    [domainUrl, showError]
  );

  // restaura sessão ao montar o provider (silent para não inundar o usuário)
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingAuth(true);
      try {
        await fetchAndSetUser({ silent: true });
      } catch (err) {
        console.error(err);
        // fetchAndSetUser já tratou / logou
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
    if (!domainUrl) {
      const e = new Error("domainUrl não configurado");
      showError(normalizeError(e));
    }

    try {
      await authenticateUser({ domainUrl, identifier });

      // tenta buscar usuário e **mostra erro** se algo falhar
      const data = await fetchAndSetUser({ silent: false });

      if (!data) {
        // fetchAndSetUser já chamou showError
        throw new Error("Falha ao recuperar dados do usuário após autenticação");
      }

      return true;
    } catch (err) {
      console.error("[Auth] authenticate erro:", err?.message || err);
      // exibir erro amigável
      try {
        showError(normalizeError(err));
      } catch (e) {console.error(e);}
      throw err;
    }
  }

  // login como convidado
  async function loginAsGuest() {
    if (!domainUrl) {
      const e = new Error("domainUrl não configurado");
      showError(normalizeError(e));
      throw e;
    }

    try {
      await loginGuest({ domainUrl });

      // após backend setar cookie, buscamos o usuário (mostrando erro se falhar)
      const u = await fetchAndSetUser({ silent: false });

      setUser(u);
      setIsAuthenticated(!!u);

      return { user: u };
    } catch (err) {
      console.error("[Auth] loginAsGuest erro:", err?.message || err);
      try {
        showError(normalizeError(err));
      } catch (e) {console.error(e);}
      throw err;
    }
  }

  // logout
  async function logout() {
    if (!domainUrl) {
      // limpeza local mesmo sem backend
      setUser(null);
      setIsAuthenticated(false);
      setStructure(null);
      try {
        sessionStorage.removeItem("onboarding_done");
        localStorage.removeItem("onboarding_done");
        localStorage.removeItem("structure");
      } catch (e) {console.error(e);}
      return;
    }

    try {
      try {
        await logoutUser({ domainUrl });
      } catch (e) {
        // se endpoint não existir ou der erro, apenas logamos e seguimos limpeza local
        console.warn("[Auth] logoutUser falhou:", e?.message || e);
      }

      if (user?.guest) {
        try {
          clearGuestWorkspaces();
        } catch (e) {
          console.warn("[Auth] clearGuestWorkspaces falhou:", e?.message || e);
        }
      }

      try {
        sessionStorage.removeItem("onboarding_done");
        localStorage.removeItem("onboarding_done");
        localStorage.removeItem("structure");
      } catch (e) {console.error(e);}

      setUser(null);
      setIsAuthenticated(false);
      setStructure(null);
    } catch (err) {
      console.error("[Auth] logout erro:", err?.message || err);
      try {
        showError(normalizeError(err));
      } catch (e) {console.error(e);}
    }
  }

  const updateUser = (patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

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
    refreshUser: fetchAndSetUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}