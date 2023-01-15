import { hydrateRoot } from "react-dom/client";
import { createApp } from "app/create";
import "./styles.css";

window.addEventListener("DOMContentLoaded", () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const bootstrap = (window as any)["bootstrap"] as { content: string };
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  hydrateRoot(document.getElementById("root")!, createApp(bootstrap));
});
