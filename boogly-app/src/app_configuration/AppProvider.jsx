import { useState } from "react";
import { AppContext } from "./AppContext";

export function AppProvider({ children }) {
  const [appName, setAppName] = useState("NóLab"); // app name definition
  const [domainUrl, setDomanUrl] = useState("http://localhost:3000");

  return (
    <AppContext.Provider value={{ appName, setAppName, domainUrl, setDomanUrl }}>
      {children}
    </AppContext.Provider>
  );
}