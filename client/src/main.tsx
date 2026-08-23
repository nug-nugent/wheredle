import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "./index.css";
import AlexApp from "./alex/AlexApp.tsx";
import App from "./App.tsx";
import { MODE, PAGE_TITLE } from "./mode.ts";

const Page = MODE === "alex" ? AlexApp : App;

document.title = PAGE_TITLE[MODE];

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
