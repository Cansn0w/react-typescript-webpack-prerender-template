import { hydrateRoot } from "react-dom/client";
import { createApp } from "app/create";
import "./styles.css";

window.addEventListener("DOMContentLoaded", () => {
  const bootstrap = (window as any)["bootstrap"] as { content: string };
  hydrateRoot(document.getElementById("root")!, createApp(bootstrap));
});
