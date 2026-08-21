import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "./index.css";
import AlexApp from "./alex/AlexApp.tsx";
import App from "./App.tsx";

const isAlexPath = window.location.pathname.replace(/\/+$/, "").endsWith("/alex");
const Page = isAlexPath ? AlexApp : App;

document.title = isAlexPath ? "Wheredle - Alex mode" : "Wheredle";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* The game palette is a fixed light one (see theme.ts), so Mantine's
        own chrome — the autocomplete dropdown, the menus — is pinned to
        light too rather than turning dark inside a light app on a machine
        set to dark mode. */}
    <MantineProvider forceColorScheme="light">
      <Page />
    </MantineProvider>
  </StrictMode>
);
