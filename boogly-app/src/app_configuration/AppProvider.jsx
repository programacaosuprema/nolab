import { useState } from "react";
import { AppContext } from "./AppContext";

export function AppProvider({ children }) {
  const [appName, setAppName] = useState("NóLab"); // app name definition
  const [domainUrl, setDomanUrl] = useState(import.meta.env.VITE_API_URL);

  return (
    <AppContext.Provider value={{ appName, setAppName, domainUrl, setDomanUrl }}>
      {children}
    </AppContext.Provider>
  );
}