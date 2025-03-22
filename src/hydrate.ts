import { hydrateRoot, createRoot } from "react-dom/client";
import { createApp } from "app/create";
import { RenderMode } from "types";
import "./styles.css";

window.addEventListener("DOMContentLoaded", () => {
  const bootstrap = window.bootstrap;
  const root = document.getElementById("root");
  if (root == null || bootstrap == null) {
    throw new Error("Root element or bootstrap data not found");
  }
  if (bootstrap.mode === RenderMode.SERVER) {
    hydrateRoot(root, createApp(bootstrap.data));
  } else {
    createRoot(root).render(createApp(bootstrap.data));
  }
});
