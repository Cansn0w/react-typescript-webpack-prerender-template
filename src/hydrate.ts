import * as ReactDom from "react-dom";
import { createApp } from "app/create";
import "./styles.css";

window.addEventListener("DOMContentLoaded", () => {
  const bootstrap = (window as any)["bootstrap"] as { content: string };
  ReactDom.hydrate(createApp(bootstrap), document.getElementById("root"));
});
