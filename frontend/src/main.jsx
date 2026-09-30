import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/features.css";
import axios from "axios";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";

// No request may hang forever (pages use axios directly).
axios.defaults.timeout = 45_000;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);