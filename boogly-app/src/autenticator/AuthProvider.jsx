import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../autenticator/AuthContext";
import { AppContext } from "../app_configuration/AppContext";
import { clearGuestWorkspaces } from "../blockly/workspaceStorage";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [structure, setStructure] = useState();
  const [loadingAuth, setLoadingAuth] = useState(true);

  const { domainUrl } = useContext(AppContext);

  // 🔥 RESTAURA SESSÃO AO ABRIR APP
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoadingAuth(false);
      return;
    }

    async function loadUser() {
      try {
        const res = await fetch(`${domainUrl}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        setUser(data);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoadingAuth(false);
      }
    }

    loadUser();
  }, [domainUrl]);

  // 🔥 LOGIN
  async function authenticate(identifier) {
    const res = await fetch(`${domainUrl}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: identifier }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro na autenticação");
    }

    localStorage.setItem("token", data.token);
    setUser(data.user);
    setIsAuthenticated(true);
  }

  // 🔥 LOGIN COMO VISITANTE
  async function loginAsGuest() {
    const res = await fetch(`${domainUrl}/auth/guest`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao entrar como visitante");
    }

    localStorage.setItem("token", data.token);
    setUser(data.user);
    setIsAuthenticated(true);
  }

  // 🔥 LOGOUT
  function logout() {
    // Seu schema usa o campo "guest"
    if (user?.guest === true) {
      clearGuestWorkspaces();
    }

    localStorage.removeItem("token");

    setUser(null);
    setIsAuthenticated(false);
    setStructure(undefined);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loadingAuth,

        authenticate,
        loginAsGuest,
        logout,

        structure,
        setStructure,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}