import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import AlexApp from "./alex/AlexApp.tsx";
import App from "./App.tsx";

const Page = window.location.pathname === "/alex" ? AlexApp : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <Page />
    </MantineProvider>
  </StrictMode>
);
