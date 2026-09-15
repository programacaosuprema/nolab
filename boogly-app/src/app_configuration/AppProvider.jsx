import {useState } from "react";
import { AppContext } from "./AppContext";

export function AppProvider({ children }) {
  const [appName, setAppName] = useState("NóLab"); // app name definition
  const [domainUrl, setDomanUrl] = useState(import.meta.env.VITE_API_URL);
  const [mainRoute, setMainRoute] = useState("/app")

  return (
    <AppContext.Provider value={{ appName, setAppName, domainUrl, setDomanUrl, mainRoute, setMainRoute }}>
      {children}
    </AppContext.Provider>
  );
}