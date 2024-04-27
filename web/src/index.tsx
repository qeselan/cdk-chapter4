import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "styled-components";
import { App } from "./components/App";
import { Global } from "./styles/global";
import { light_theme } from "./styles/theme";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={light_theme}>
      <App />

      <Global />
    </ThemeProvider>
  </React.StrictMode>
);
